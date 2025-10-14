import { build } from "esbuild";

const isProd = process.env.NODE_ENV === "production";

await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    target: ["node18"],
    outfile: "dist/sidecar.cjs",
    format: "cjs",
    sourcemap: !isProd,
    minify: isProd,
    banner: { js: "#!/usr/bin/env node" },
    legalComments: "none"
});

console.log(`[esbuild] done -> dist/sidecar.cjs`);