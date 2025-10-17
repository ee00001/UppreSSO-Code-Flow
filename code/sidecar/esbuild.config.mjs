import { build } from "esbuild";

const isProd = process.env.NODE_ENV === "production";

await build({
    entryPoints: ["src/index.ts"],
    outfile: "dist/sidecar.cjs",
    bundle: true,
    platform: "node",
    format: "cjs",
    target: ["node18"],

    external: [
        "@cloudflare/blindrsa-ts",
    ],

    keepNames: true,
    preserveSymlinks: false,

    sourcemap: !isProd,
    minify: isProd,
    banner: { js: "#!/usr/bin/env node" },
    legalComments: "none"
});

console.log(`[esbuild] done -> dist/sidecar.cjs`);