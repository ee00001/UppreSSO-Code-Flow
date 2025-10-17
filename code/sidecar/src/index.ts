import { loadConfig } from "./config.js";
import { TokenStore } from "./token-store.js";
import { startServer } from "./issuer-client.js";

async function main() {
    const cfg = loadConfig();
    const store = new TokenStore(cfg.storePath);

    startServer(cfg, store);
}

main().catch((e) => {
    console.error("[sidecar] fatal:", e);
    process.exit(1);
});