import fs from "node:fs";

export interface StoredToken {
    tokenB64: string;   // 以 base64url 或 base64 存（按解析结果决定）
    exp?: number;       // 可选过期秒级时间戳
}

export class TokenStore {
    constructor(private file: string) {}

    private readAll(): StoredToken[] {
        try { return JSON.parse(fs.readFileSync(this.file, "utf8")); }
        catch { return []; }
    }
    private writeAll(list: StoredToken[]) {
        fs.writeFileSync(this.file, JSON.stringify(list), "utf8");
    }

    countValid(): number {
        const now = Math.floor(Date.now()/1000);
        return this.readAll().filter(t => !t.exp || t.exp > now).length;
    }

    pushMany(tokens: StoredToken[]) {
        const all = this.readAll();
        all.push(...tokens);
        this.writeAll(all);
    }

    popOne(): StoredToken | null {
        const all = this.readAll();
        const now = Math.floor(Date.now()/1000);
        const idx = all.findIndex(t => !t.exp || t.exp > now);
        if (idx < 0) return null;
        const [taken] = all.splice(idx, 1);
        this.writeAll(all);
        return taken;
    }
}