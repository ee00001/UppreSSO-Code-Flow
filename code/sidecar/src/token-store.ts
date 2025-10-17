import { promises as fs } from "node:fs";
import { base64url } from "rfc4648";

export interface TokenStoreShape {
    tokens: string[]; // base64url-encoded Token bytes
}

export class TokenStore {
    constructor(private filePath: string) {}

    async load(): Promise<TokenStoreShape> {
        try {
            const s = await fs.readFile(this.filePath, "utf8");
            const obj = JSON.parse(s);
            if (!obj.tokens || !Array.isArray(obj.tokens)) return { tokens: [] };
            return { tokens: obj.tokens as string[] };
        } catch {
            return { tokens: [] };
        }
    }

    async save(data: TokenStoreShape): Promise<void> {
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf8");
    }

    async addMany(b64uTokens: string[]): Promise<void> {
        const cur = await this.load();
        cur.tokens.push(...b64uTokens);
        await this.save(cur);
    }

    async take(n: number): Promise<string[]> {
        const cur = await this.load();
        const out = cur.tokens.splice(0, Math.max(0, Math.min(n, cur.tokens.length)));
        await this.save(cur);
        return out;
    }

    async count(): Promise<number> {
        const cur = await this.load();
        return cur.tokens.length;
    }

    static toB64u(u8: Uint8Array): string {
        return base64url.stringify(u8, { pad: false });
    }
    static fromB64u(s: string): Uint8Array {
        return new Uint8Array(base64url.parse(s));
    }
}