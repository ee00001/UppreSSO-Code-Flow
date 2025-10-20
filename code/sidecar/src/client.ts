import http from "node:http";
import { URL } from "node:url";
import { TokenStore } from "./token-store.js";
import { getTokensOnce } from "./batch.js";
import { SidecarConfig } from "./config.js";
import { handleVerify } from "./verify.js";
import { base64url } from "rfc4648";

const toB64u = (u: Uint8Array) => base64url.stringify(u);

export function startServer(cfg: SidecarConfig, store: TokenStore) {
    const server = http.createServer(async (req, res) => {
        try {
            if (!req.url) { res.statusCode = 400; return res.end("bad request"); }
            const url = new URL(req.url, `http://localhost:${cfg.port}`);

            // health
            if (req.method === "GET" && url.pathname === "/health") {
                const count = await store.count();
                res.writeHead(200, { "content-type": "application/json" });
                return res.end(JSON.stringify({ ok: true, tokens: count }));
            }

            // prefetch?count=N
            if (req.method === "POST" && url.pathname === "/prefetch") {
                const count = Number(url.searchParams.get("count") ?? cfg.prefetchBatchSize);
                const tokens = await getTokensOnce(cfg.issuerDirectoryUrl, count, cfg.extraHeaders, cfg.issuerRequestUrl);
                const b64u = tokens.map(toB64u);
                await store.addMany(b64u);
                res.writeHead(200, { "content-type": "application/json" });
                return res.end(JSON.stringify({ ok: true, added: b64u.length, total: await store.count() }));
            }

            // take?count=N
            if (req.method === "POST" && url.pathname === "/take") {
                const count = Number(url.searchParams.get("count") ?? 1);
                const tokens = await store.take(count);
                res.writeHead(200, { "content-type": "application/json" });
                return res.end(JSON.stringify({
                    ok: true,
                    items: tokens.map(t => ({ header: `PrivateToken token="${t}"` })),
                    remaining: await store.count()
                }));
            }

            if (req.method === "POST" && url.pathname === "/verify") {
                return handleVerify(req, res, cfg); // 核心逻辑在 verify.ts
            }

            res.statusCode = 404;
            res.end("not found");
        } catch (err: any) {
            res.statusCode = 500;
            res.end(`error: ${err?.message ?? String(err)}`);
        }
    });

    server.listen(cfg.port, () => {
        console.log(`[sidecar] listening on :${cfg.port}`);
        console.log(`[sidecar] issuer directory: ${cfg.issuerDirectoryUrl}`);
    });

    return server;
}