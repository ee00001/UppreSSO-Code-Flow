import { IncomingMessage, ServerResponse } from "node:http";
import { publicVerif, util, MediaType, Token } from "@cloudflare/privacypass-ts";
import { base64url } from "rfc4648";
import { webcrypto as _webcrypto } from "node:crypto";
import type { SidecarConfig } from "./config.js";

const crypto_ = (globalThis as any).crypto ?? _webcrypto;
// 简易 5 分钟公钥缓存；生产可换 Redis/本地文件缓存
const keyCache: { spkiKey: CryptoKey | null; ts: number } = { spkiKey: null, ts: 0 };

// 简易内存防重放；生产建议改 Redis: SETNX token_hash + TTL
const spent = new Set<string>();

async function readJson(req: IncomingMessage): Promise<any> {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    if (!chunks.length) return {};
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { return {}; }
}

// Authorization: PrivateToken token="..."
function parseAuth(header?: string | null): string | null {
    if (!header) return null;
    const m = header.match(/^\s*PrivateToken\s+token="([^"]+)"\s*$/i);
    return m ? m[1] : null;
}

async function getVerifyKeyFromDirectory(dirUrl: string, extra?: Record<string,string>): Promise<CryptoKey> {
    const now = Date.now();
    if (keyCache.spkiKey && (now - keyCache.ts) < 5 * 60_000) return keyCache.spkiKey!;

    const res = await fetch(dirUrl, { headers: { accept: MediaType.PRIVATE_TOKEN_ISSUER_DIRECTORY, ...(extra ?? {}) }});
    if (res.status !== 200) throw new Error(`directory HTTP ${res.status}`);
    const dir = await res.json() as {
        ["token-keys"]: Array<{["token-type"]: number; ["token-key"]: string;}>;
    };
    if (!dir["token-keys"]?.length) throw new Error("no token-keys in directory");

    const rsapss = base64url.parse(dir["token-keys"][0]["token-key"]);
    const enc = util.convertRSASSAPSSToEnc(rsapss);
    const spkiBuf = enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength);

    const spkiKey = await crypto_.subtle.importKey(
        "spki",
        spkiBuf,
        { name: "RSA-PSS", hash: "SHA-384" },
        false,
        ["verify"]
    );
    keyCache.spkiKey = spkiKey; keyCache.ts = now;
    return spkiKey;
}

export async function handleVerify(req: IncomingMessage, res: ServerResponse, cfg: SidecarConfig) {
    try {
        const body = await readJson(req);

        const authz = (req.headers["authorization"] as string | undefined);
        const tokenFromAuth = parseAuth(authz ?? null);
        const tokenFromBody = typeof body?.token === "string" ? body.token : undefined;
        const tokenB64u = tokenFromAuth ?? tokenFromBody;

        if (!tokenB64u) {
            res.writeHead(400, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "missing PrivateToken" }));
        }

        const tokenBytes = base64url.parse(tokenB64u);

        let tokenTypeEntry = publicVerif.BLIND_RSA; // 默认
        if (body?.token_type != null) {
            const v = body.token_type;
            if (typeof v === "string" && v.toLowerCase().includes("blind")) {
                tokenTypeEntry = publicVerif.BLIND_RSA;
            } else if (typeof v === "number") {
                if (v !== publicVerif.BLIND_RSA.value) {
                    res.writeHead(415, { "content-type": "application/json" });
                    return res.end(JSON.stringify({ ok: false, error: `unsupported token_type ${v}` }));
                }
            }
        }

        const digest = await crypto_.subtle.digest("SHA-256", tokenBytes);
        const tokenHash = Buffer.from(digest).toString("hex");
        if (spent.has(tokenHash)) {
            res.writeHead(409, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "replayed", token_hash: tokenHash }));
        }

        // 反序列化并验签
        const token = Token.deserialize(tokenTypeEntry, tokenBytes);
        const origin = new publicVerif.Origin(publicVerif.BlindRSAMode.PSS);
        const verifyKey = await getVerifyKeyFromDirectory(cfg.issuerDirectoryUrl, cfg.extraHeaders);

        const ok = await origin.verify(token, verifyKey);
        if (!ok) {
            res.writeHead(401, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "invalid" }));
        }

        // 标记已消费
        spent.add(tokenHash);
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify({ ok: true, token_hash: tokenHash }));

    } catch (e: any) {
        res.writeHead(500, { "content-type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: e?.message ?? String(e) }));
    }
}