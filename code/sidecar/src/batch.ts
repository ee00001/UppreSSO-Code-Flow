import { publicVerif, MediaType, arbitraryBatched, util } from "@cloudflare/privacypass-ts";
import { base64url } from "rfc4648";
import { resolveIssuerRequestUrl } from "./issuer.js";
import { webcrypto as _webcrypto } from "node:crypto";

const crypto_ = (globalThis as any).crypto ?? _webcrypto;

const { Client, BlindRSAMode, BLIND_RSA} = publicVerif;
const {
    BatchedTokenRequest,
    BatchedTokenResponse
} = arbitraryBatched;


type Finalizer = (tokResBytes: Uint8Array) => Promise<any>;
type PpTokenRequest = InstanceType<typeof publicVerif.TokenRequest>;
type PpTokenResponse = InstanceType<typeof publicVerif.TokenResponse>;

const toHex = (u8: any) => [...u8].map(b => b.toString(16).padStart(2,'0')).join(' ');
const headHex = (u8: string | any[] | Uint8Array, n=32) => toHex(u8.slice(0, Math.min(n, u8.length)));

// 目录 token-key (ENC) -> SPKI -> CryptoKey(RSA-PSS/SHA-384, verify)
async function importVerifyKeyFromDirectoryTokenKey(encKey: Uint8Array): Promise<CryptoKey> {
    // 发行端也是这么干的：ENC -> SPKI
    const spki = util.convertRSASSAPSSToEnc(encKey);
    const spkiBuf = spki.buffer.slice(spki.byteOffset, spki.byteOffset + spki.byteLength);
    return await crypto_.subtle.importKey(
        "spki",
        spkiBuf,
        { name: "RSA-PSS", hash: "SHA-384" },
        false,
        ["verify"]
    );
}

export async function buildBlindRsaRequestsN(
    issuerNameForChallenge: string,
    issuerPublicKey_ENC: Uint8Array,
    n: number
): Promise<{ requests: PpTokenRequest[]; finalizers: Finalizer[] }> {
    const requests: PpTokenRequest[] = [];
    const finalizers: Finalizer[] = [];

    const origin = new publicVerif.Origin(BlindRSAMode.PSS);
    const challenge = origin.createTokenChallenge(issuerNameForChallenge, new Uint8Array(0));


    for (let i = 0; i < n; i++) {

        const client = new Client(BlindRSAMode.PSS);

        const tokReq: PpTokenRequest = await client.createTokenRequest(challenge, issuerPublicKey_ENC);
        requests.push(tokReq);

        finalizers.push(async (tokResBytes: Uint8Array) => {
            const tokRes: PpTokenResponse = client.deserializeTokenResponse(tokResBytes);
            const token = await client.finalize(tokRes);
            return token;
        });
    }
    return { requests, finalizers };

}

export async function batchedIssueAndFinalize(
    issuerRequestUrl: string,
    tokenRequests: PpTokenRequest[],
    finalizers: Finalizer[],
    issuerPublicKey_ENC: Uint8Array,
    extraHeaders?: Record<string, string>
): Promise<Uint8Array[]> {

    const entries = tokenRequests.map(one => new arbitraryBatched.TokenRequest(one));

    const batched = new arbitraryBatched.BatchedTokenRequest(entries);

    const body = batched.serialize();

    // // === 自检：反解 batched，并打印关键信息 ===
    // let parsedReq;
    // try {
    //     parsedReq = arbitraryBatched.BatchedTokenRequest.deserialize(body);
    //     console.log('[batched] entries    =', parsedReq.tokenRequests.length);
    //
    //     parsedReq.tokenRequests.forEach((r, i) => {
    //         console.log(`[batched][${i}] tokenType   =`, r.tokenType);            // 期望 2
    //         console.log(`[batched][${i}] keyId       =`, r.truncatedTokenKeyId);
    //         console.log(`[batched][${i}] blind.len   =`, r.blindMsg?.length ?? -1);
    //         console.log(`[batched][${i}] blind.head  =`, headHex(r.blindMsg ?? new Uint8Array(0), 24));
    //     });
    // } catch (e) {
    //     console.log('[batched] deserialize ERROR:', e);
    // }

    const headers = new Headers({
        "content-type": MediaType.ARBITRARY_BATCHED_TOKEN_REQUEST,
        "accept": MediaType.ARBITRARY_BATCHED_TOKEN_RESPONSE,
        ...(extraHeaders ?? {})
    });

    const res = await fetch(issuerRequestUrl, { method: "POST", headers, body });
    if (res.status !== 200 && res.status !== 206) {
        const text = await res.text().catch(() => "");
        throw new Error(`batched issuance failed: HTTP ${res.status} ${text}`);
    }
    const ctype = res.headers.get("content-type")?.toLowerCase();
    if (ctype !== MediaType.ARBITRARY_BATCHED_TOKEN_RESPONSE) {
        throw new Error(`unexpected Content-Type: ${ctype}`);
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    const parsed = BatchedTokenResponse.deserialize(buf);

    const out: Uint8Array[] = [];
    const verifyOrigin = new publicVerif.Origin(publicVerif.BlindRSAMode.PSS);
    const verifyKey = await importVerifyKeyFromDirectoryTokenKey(issuerPublicKey_ENC);

    for (let i = 0; i < parsed.tokenResponses.length && i < finalizers.length; i++) {
        const entry = parsed.tokenResponses[i];
        if (!entry.tokenResponse) {
            console.warn(`[verify][${i}] tokenResponse = null`);
            continue;
        }

        const token = await finalizers[i](entry.tokenResponse);

        if (verifyOrigin) {
            try {
                const ok = await verifyOrigin.verify(token, verifyKey);
                out.push(token.serialize());
                console.log(`[verify][${i}] ${ok ? 'OK' : 'FAIL'}`);
            } catch (e: any) {
                console.warn(`[verify][${i}] error: ${e?.message ?? e}`);
            }
        }
    }
    return out;
}


/**
 * 从目录拉取、选 key、构造 N 个请求并 batched 发送，最终返回 token bytes 列表
 */
export async function getTokensOnce(
    issuerDirectoryUrl: string,
    count: number,
    extraHeaders?: Record<string, string>,
    explicitIssuerRequestUrl?: string
): Promise<Uint8Array[]> {
    const issuerRequestUrl = await resolveIssuerRequestUrl(
        issuerDirectoryUrl,
        explicitIssuerRequestUrl,
        extraHeaders
    );
    const dirRes = await fetch(issuerDirectoryUrl, {
        headers: { "accept": MediaType.PRIVATE_TOKEN_ISSUER_DIRECTORY, ...(extraHeaders ?? {}) }
    });
    if (dirRes.status !== 200) {
        throw new Error(`get directory failed: HTTP ${dirRes.status}`);
    }
    const dir = await dirRes.json() as {
        ["issuer-request-uri"]: string;
        ["token-keys"]: Array<{["token-type"]: number; ["token-key"]: string; ["not-before"]?: number;}>;
    };
    if (!dir["token-keys"]?.length) throw new Error("no token-keys in directory");

    console.log(`[sidecar] (prefetch) POST batched(${count}) -> ${issuerRequestUrl}`);
    const issuerUrl = (() => {
        try { new URL(dir["issuer-request-uri"]); return dir["issuer-request-uri"]; }
        catch { const base = new URL(issuerRequestUrl); return `${base.origin}${dir["issuer-request-uri"]}`; }
    })();

    const tk = dir["token-keys"][0];
    if (tk["token-type"] !== BLIND_RSA.value) {
        throw new Error(`unsupported token-type ${tk["token-type"]}`);
    }

    const rsapss = base64url.parse(tk["token-key"]);
    const encPub = util.convertRSASSAPSSToEnc(rsapss);
    const issuerHostForChallenge = new URL(issuerUrl).host;

    const { requests, finalizers } = await buildBlindRsaRequestsN(
        issuerHostForChallenge, rsapss, count
    );

    return await batchedIssueAndFinalize(issuerUrl, requests, finalizers, encPub ,extraHeaders);
}


