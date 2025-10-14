import http from "node:http";
import { loadConfig } from "./config";
import { TokenStore } from "./token-store";
import { mintBatchTokens } from "./issuer-client";

const cfg = loadConfig();
const store = new TokenStore(cfg.storePath);

async function ensureTokens(minCount: number) {
    const have = store.countValid();
    if (have >= minCount) return 0;
    const need = minCount - have;
    const batch = Math.max(need, cfg.prefetchBatchSize);
    const { minted } = await mintBatchTokens(batch, cfg.issuerDirectoryUrl, cfg.extraHeaders);
    store.pushMany(minted);
    return minted.length;
}

const server = http.createServer(async (req, res) => {
    try {
        // health
        if (req.method === "GET" && req.url === "/health") {
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true, tokens: store.countValid() }));
            return;
        }

        // ensureTokens
        if (req.method === "POST" && req.url === "/ensureTokens") {
            const body = await new Promise<string>(r => {
                let s=""; req.on("data", c => s+=c); req.on("end", () => r(s||"{}"));
            });
            const { minCount } = JSON.parse(body);
            const minted = await ensureTokens(Number(minCount ?? cfg.prefetchBatchSize));
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ minted, available: store.countValid() }));
            return;
        }

        // popToken
        if (req.method === "POST" && req.url === "/popToken") {
            const t = store.popOne();
            if (!t) { res.writeHead(404); res.end("no token"); return; }
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify(t));
            return;
        }

        res.writeHead(404); res.end("not found");
    } catch (e:any) {
        res.writeHead(500); res.end(String(e?.message ?? e));
    }
});

server.listen(cfg.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[sidecar] listening on ${cfg.port}`);
});