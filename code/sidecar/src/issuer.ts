import { MediaType } from "@cloudflare/privacypass-ts";

export async function resolveIssuerRequestUrl(
    issuerDirectoryUrl: string,
    explicitIssuerRequestUrl?: string,
    extraHeaders?: Record<string, string>
): Promise<string> {
    if (explicitIssuerRequestUrl) {
        console.log(`[sidecar] (resolve) using explicit issuer request: ${explicitIssuerRequestUrl}`);
        return explicitIssuerRequestUrl; // 已指定端点，直接返回
    }

    console.log(`[sidecar] (resolve) GET directory: ${issuerDirectoryUrl}`);
    const res = await fetch(issuerDirectoryUrl, {
        method: "GET",
        headers: { accept: MediaType.PRIVATE_TOKEN_ISSUER_DIRECTORY, ...(extraHeaders ?? {}) },
    });
    if (res.status !== 200) {
        throw new Error(`issuer directory fetch failed: HTTP ${res.status}`);
    }
    const ctype = res.headers.get("content-type")?.toLowerCase();
    if (ctype !== MediaType.PRIVATE_TOKEN_ISSUER_DIRECTORY) {
        throw new Error(`unexpected directory Content-Type: ${ctype}`);
    }
    const doc = await res.json() as { ["issuer-request-uri"]: string };
    const uri = doc["issuer-request-uri"];
    if (!uri) throw new Error(`issuer-request-uri missing in directory`);

    // 绝对 URL 直接返回；相对路径拼目录 origin
    let finalUrl: string;
    try {
        new URL(uri); // 绝对 URL
        return uri;
    } catch {
        const base = new URL(issuerDirectoryUrl);
        finalUrl = `${base.origin}${uri.startsWith("/") ? uri : `/${uri}`}`;
    }

    console.log(`[sidecar] (resolve) issuer request resolved: ${finalUrl}`);
    return finalUrl;
}