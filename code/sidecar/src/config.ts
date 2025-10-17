export interface SidecarConfig {
    port: number;
    issuerDirectoryUrl: string;
    prefetchBatchSize: number;
    storePath: string;

    extraHeaders?: Record<string, string>;

    issuerRequestUrl?: string;
}

export function loadConfig(): SidecarConfig {
    const port = Number(process.env.SIDECAR_PORT ?? 9797);
    // issuer URL
    const issuerDirectoryUrl =
        process.env.ISSUER_DIRECTORY_URL ??
        "http://127.0.0.1:8787/.well-known/private-token-issuer-directory";
    const issuerRequestUrl = process.env.ISSUER_REQUEST_URL ?? undefined;

    const prefetchBatchSize = Number(process.env.PREFETCH_BATCH_SIZE ?? 50);
    const storePath = process.env.SIDECAR_STORE_PATH ?? "../tokens.json";

    const extraHeaders =
        process.env.ISSUER_EXTRA_HEADERS
            ? JSON.parse(process.env.ISSUER_EXTRA_HEADERS)
            : undefined;

    return { port, issuerDirectoryUrl, prefetchBatchSize, storePath, extraHeaders, issuerRequestUrl, };
}