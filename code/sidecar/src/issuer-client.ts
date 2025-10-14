import { MediaType, arbitraryBatched, publicVerif, TOKEN_TYPES, util } from "@cloudflare/privacypass-ts";
const { BatchedTokenRequest, BatchedTokenResponse } = arbitraryBatched;

export interface IssuerDirectory {
    "issuer-request-uri": string;   // e.g. "/token-request"
    "token-keys": Array<{
        "token-type": number;         // 应为 BlindRSA=2
        "token-key": string;          // 公钥（base64url）
        "not-before": number;         // 秒级
    }>;
}

export interface MintResult {
    minted: { tokenB64: string; exp?: number }[];
}

/** 拉取目录 */
export async function fetchDirectory(issuerDirectoryUrl: string): Promise<IssuerDirectory> {
    const res = await fetch(issuerDirectoryUrl, { method: "GET", headers: { "accept": MediaType.PRIVATE_TOKEN_ISSUER_DIRECTORY } });
    if (!res.ok) throw new Error(`directory HTTP ${res.status}`);
    const ctype = res.headers.get("content-type") || "";
    if (!ctype.startsWith(MediaType.PRIVATE_TOKEN_ISSUER_DIRECTORY)) {
        throw new Error(`unexpected content-type: ${ctype}`);
    }
    return res.json();
}

/** 从目录里挑最新 key（挑第一个） */
export function pickFreshestKey(doc: IssuerDirectory) {
    if (!doc["token-keys"]?.length) throw new Error("no token-keys");
    // 简单取第一个；
    const k = doc["token-keys"][0];
    if (k["token-type"] !== TOKEN_TYPES.BLIND_RSA.value) {
        throw new Error("issuer key is not BlindRSA");
    }
    return k;
}

