// src/test.mjs
import { arbitraryBatched, publicVerif, Token } from '@cloudflare/privacypass-ts';
import { base64url } from 'rfc4648';
const crypto_ = globalThis.crypto ?? (await import('node:crypto')).webcrypto;

// —— 工具：十六进制输出 —— //
const toHex = (u8) => [...u8].map(b => b.toString(16).padStart(2,'0')).join(' ');
const headHex = (u8, n=32) => toHex(u8.slice(0, Math.min(n, u8.length)));

// 简易 req/res mock：满足 handleVerify 的最小需要
function makeReqResWithAuth(authorizationHeader) {
    // 伪 req：仅提供 headers 和异步可读的 body（这里走 Authorization，不需要 body）
    const req = {
        method: 'POST',
        url: '/verify',
        headers: { authorization: authorizationHeader },
        // handleVerify 会用 for-await 读请求体，这里返回空 body
        [Symbol.asyncIterator]: async function* () { /* no body */ }
    };

    // 伪 res：收集 writeHead 和 end 的结果
    const res = {
        statusCode: 200,
        headers: {},
        body: '',
        writeHead(code, headers) {
            this.statusCode = code;
            if (headers) this.headers = { ...headers };
        },
        setHeader(k, v) { this.headers[k] = v; },
        end(chunk) {
            if (chunk != null) {
                this.body = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
            }
            this.ended = true;
        }
    };

    return { req, res };
}

function parseAuth(header) {
    if (!header) return null;
    const m = header.match(/^\s*PrivateToken\s+token="([^"]+)"\s*$/i);
    return m ? m[1] : null;
}

// 简单内存防重放（测试用）；生产换 Redis: SETNX token_hash + TTL
const spent = new Set();

async function localVerify({ authorization, verifyPublicKey }) {
    // 1) 从 Authorization 取出 base64url token
    const tokenB64u = parseAuth(authorization);
    if (!tokenB64u) {
        return { status: 400, body: { ok: false, error: 'missing PrivateToken' } };
    }

    // 2) 解码 & 防重放（对原字节 SHA-256）
    const tokenBytes = base64url.parse(tokenB64u);
    const digest = await crypto_.subtle.digest('SHA-256', tokenBytes);
    const tokenHash = Buffer.from(digest).toString('hex');
    if (spent.has(tokenHash)) {
        return { status: 409, body: { ok: false, error: 'replayed', token_hash: tokenHash } };
    }

    // 3) 反序列化（显式给出类型：Blind RSA）
    const tok = Token.deserialize(publicVerif.BLIND_RSA, tokenBytes);

    // 4) 验签（使用本地生成的 kp.publicKey）
    const origin = new publicVerif.Origin(publicVerif.BlindRSAMode.PSS);
    const ok = await origin.verify(tok, verifyPublicKey);
    if (!ok) {
        return { status: 401, body: { ok: false, error: 'invalid' } };
    }

    // 5) 首次消费成功 -> 标记已用
    spent.add(tokenHash);
    return { status: 200, body: { ok: true, token_hash: tokenHash } };
}

async function main () {
    // 1) 生成 Issuer 的 RSA-PSS 密钥（2048）
    const kp = await publicVerif.Issuer.generateKey(
        publicVerif.BlindRSAMode.PSS,
        { modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]) }
    );

    // 2) 取客户端使用的 Issuer 公钥字节
    const issuerPubBytes = await publicVerif.getPublicKeyBytes(kp.publicKey);

    // 3) 用 Origin 生成合法的 TokenChallenge（而不是直接 new TokenChallenge）
    const origin = new publicVerif.Origin(publicVerif.BlindRSAMode.PSS);
    const challenge = origin.createTokenChallenge('issuer.example', new Uint8Array(0));

    // 4) Client 生成“单条合法 TokenRequest”
    const clients = [
        new publicVerif.Client(publicVerif.BlindRSAMode.PSS),
        new publicVerif.Client(publicVerif.BlindRSAMode.PSS),
        new publicVerif.Client(publicVerif.BlindRSAMode.PSS)
    ];
    const tokReqs = [
        await clients[0].createTokenRequest(challenge, issuerPubBytes),
        await clients[1].createTokenRequest(challenge, issuerPubBytes),
        await clients[2].createTokenRequest(challenge, issuerPubBytes)
    ];

    // 6) 序列化并打印十六进制（只打印前 32 字节避免刷屏）
    const bytes = tokReqs[0].serialize();

    // 7) 回解校验（用 BLIND_RSA 指定类型）
    const round = publicVerif.TokenRequest.deserialize(publicVerif.BLIND_RSA, bytes);
    console.log('[single] round-trip OK?',
        round.tokenType === tokReqs[0].tokenType &&
        round.truncatedTokenKeyId === tokReqs[0].truncatedTokenKeyId &&
        round.blindedMsg.length === tokReqs[0].blindedMsg.length
    );


    // 1) 包装成 batched 的条目类型
    const entries = tokReqs.map(one => new arbitraryBatched.TokenRequest(one));

    // 2) 组装 batched
    const batched = new arbitraryBatched.BatchedTokenRequest(entries);

    const batchedBytes = batched.serialize();

    // 4) 直接回解，打印每条的关键信息（type/keyId/blind 长度 & 预览）
    let parsedReq;
    try {
        parsedReq = arbitraryBatched.BatchedTokenRequest.deserialize(batchedBytes);
        console.log('[batched] entries    =', parsedReq.tokenRequests.length);

        parsedReq.tokenRequests.forEach((r, i) => {
            console.log(`[batched][${i}] tokenType   =`, r.tokenType);            // 期望 2
            console.log(`[batched][${i}] keyId       =`, r.truncatedTokenKeyId);
            console.log(`[batched][${i}] blind.len   =`, r.blindMsg?.length ?? -1);
            console.log(`[batched][${i}] blind.head  =`, headHex(r.blindMsg ?? new Uint8Array(0), 24));
        });
    } catch (e) {
        console.log('[batched] deserialize ERROR:', e && (e.stack || e.message || e));
    }

    const singleIssuer = new publicVerif.Issuer(
        publicVerif.BlindRSAMode.PSS,
        'issuer.example',
        kp.privateKey,
        kp.publicKey
    );
    const batchedIssuer = new arbitraryBatched.Issuer(singleIssuer);

    const batchedResponse = await batchedIssuer.issue(parsedReq);
    const batchedResBytes = batchedResponse.serialize();
    console.log('--- BatchedTokenResponse.serialize() ---');
    console.log('[bres] len        =', batchedResBytes.length);
    console.log('[bres] head32(hex)=', headHex(batchedResBytes, 32));

    const parsedRes = arbitraryBatched.BatchedTokenResponse.deserialize(batchedResBytes);
    console.log('[bres] entries    =', parsedRes.tokenResponses.length);
    parsedRes.tokenResponses.forEach((entry, i) => {
        if (entry.tokenResponse) {
            console.log(`[bres][${i}] has tokenResponse = true, len=${entry.tokenResponse.length}`);
            console.log(`[bres][${i}] tokenResponse.head =`, headHex(entry.tokenResponse, 24));
        } else {
            console.log(`[bres][${i}] has tokenResponse = false (null)`);
        }
    });

    // 6) finalize：逐条把 tokenResponse -> Token（务必使用对应的 client）
    const tokens = [];
    for (let i = 0; i < parsedRes.tokenResponses.length; i++) {
        const entry = parsedRes.tokenResponses[i];
        if (!entry.tokenResponse) {
            tokens.push(null);
            continue;
        }
        const tokRes = clients[i].deserializeTokenResponse(entry.tokenResponse);
        const token  = await clients[i].finalize(tokRes);
        tokens.push(token);
    }

    // // 7) 验签：Origin.verify(token, 发行者公钥)
    // const verifyOrigin = new publicVerif.Origin(publicVerif.BlindRSAMode.PSS);
    // for (let i = 0; i < tokens.length; i++) {
    //     if (!tokens[i]) {
    //         console.log(`[verify][${i}] null`);
    //         continue;
    //     }
    //     const ok = await verifyOrigin.verify(tokens[i], kp.publicKey);
    //     console.log(`[verify][${i}] ${ok ? 'OK' : 'FAIL'}`);
    // }
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (!t) {
            console.log(`[verify][${i}] null`);
            continue;
        }
        const tokB64u = base64url.stringify(t.serialize());
        const authorization = `PrivateToken token="${tokB64u}"`;

        const { status, body } = await localVerify({
            authorization,
            verifyPublicKey: kp.publicKey, // ← 用本地生成的发行者公钥
        });

        if (status === 200) {
            console.log(`[verify][${i}] OK`, body);
        } else {
            console.log(`[verify][${i}] FAIL HTTP ${status}`, body);
        }
    }
}

main().catch(e => { console.error(e); process.exit(1); });
