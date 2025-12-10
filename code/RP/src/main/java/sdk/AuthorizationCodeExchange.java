package sdk;

import com.google.gson.Gson;

import sdk.bhttp.BinaryHttpMessage;
import sdk.bhttp.BinaryHttpRequest;
import sdk.bhttp.BinaryHttpResponse;
import sdk.ohttp.*;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import static sdk.ohttp.OHttpConfig.RELAY_URL;

public class AuthorizationCodeExchange {

    static final class KeyConfigResult {
        final OHttpHeaderKeyConfig header; // 用于 7 字节请求头的 (key_id, kem, kdf, aead)
        final byte[] publicKey;            // HPKE 公钥 Npk 字节
        KeyConfigResult(OHttpHeaderKeyConfig h, byte[] pk) { this.header = h; this.publicKey = pk; }
    }

    public static Map<String, String> exchangeCodeForToken(
            String code, String idpDomain, String verifier) throws Exception {

        //  拉取/缓存公钥
        KeyConfigResult kcr= getOrFetchServerPubKey(idpDomain);

        // 构造 bHTTP 请求
        byte[] bhttp = buildBHttpRequest(code, verifier, idpDomain);

        // 通过 OHTTP 客户端发往 IdP 的 /gateway
        OHttpClient ohttpClient = new OHttpClient(kcr.header, kcr.publicKey);
        byte[] plaintextResp = ohttpClient.sendOHttpRequest(bhttp, RELAY_URL);

        BinaryHttpResponse bresp = BinaryHttpResponse.deserialize(plaintextResp);

        String json = new String(bresp.getBody(), StandardCharsets.UTF_8);

//        byte[] bodyBytes = bresp.getBody();
//        System.out.println("[dbg] bodyBytes=" + bodyBytes.length + " bytes");

//        // 打印服务器结果，测试用
//        try {
//            com.google.gson.Gson prettyGson = new com.google.gson.GsonBuilder()
//                    .setPrettyPrinting()
//                    .disableHtmlEscaping()
//                    .create();
//            com.google.gson.JsonElement je = com.google.gson.JsonParser.parseString(json);
//            System.out.println("[dbg] json pretty:\n" + prettyGson.toJson(je));
//        } catch (com.google.gson.JsonSyntaxException e) {
//            System.out.println("[dbg] not valid JSON, raw body shown above. reason=" + e.getMessage());
//        }

        return new Gson().fromJson(json, Map.class);
    }


    private static KeyConfigResult getOrFetchServerPubKey(String idpDomain) throws IOException {
        File f = new File("./ohttp_pub.pem");
        if (f.exists()) {
            byte[] pub = PemFileUtil.readPem("./ohttp_pub.pem");
            return new KeyConfigResult(OHttpHeaderKeyConfig.defaultConfig(), pub);
        }
        // 没有就从 IdP 获取
        String keyUrl = idpDomain + "/openid-connect-server-webapp" + "/.well-known/ohttp-gateway-key";
        HttpURLConnection conn = (HttpURLConnection) new URL(keyUrl).openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Accept", "application/ohttp-keys");

        int status = conn.getResponseCode();
        if (status != 200) throw new IOException("fetch ohttp-keys status=" + status);
        String ctype = conn.getHeaderField("Content-Type");
        if (ctype == null || !ctype.equalsIgnoreCase("application/ohttp-keys")) {
            throw new IOException("unexpected content-type: " + ctype);
        }

        byte[] doc;
        try (InputStream is = conn.getInputStream();
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[4096];
            int len;
            while ((len = is.read(buf)) != -1) {
                bos.write(buf, 0, len);
            }
            doc = bos.toByteArray();
        }

        // 客户端偏好（按顺序选择第一匹配）
        int[][] preferred = new int[][]{
                { HpkeKdf.HKDF_SHA256, HpkeAead.AES_128_GCM },
                { HpkeKdf.HKDF_SHA256, HpkeAead.CHACHA20_POLY1305 },
                { HpkeKdf.HKDF_SHA256, HpkeAead.AES_256_GCM },
        };

        // 逐条 entry 解析：每条以 2 字节长度前缀开始
        int off = 0;
        while (off + 2 <= doc.length) {
            int entryLen = Short.toUnsignedInt(ByteBuffer.wrap(doc, off, 2).getShort());
            off += 2;
            if (off + entryLen > doc.length) throw new IOException("truncated ohttp-keys entry");

            ByteBuffer e = ByteBuffer.wrap(doc, off, entryLen);
            off += entryLen;

            byte keyId  = e.get();
            int kemId   = Short.toUnsignedInt(e.getShort());

            int npk = getNpkByKem(kemId);
            byte[] publicKey = new byte[npk];
            e.get(publicKey);

            int suitesLen = Short.toUnsignedInt(e.getShort());
            if (suitesLen % 4 != 0 || suitesLen > e.remaining()) throw new IOException("bad suites_len");
            int m = suitesLen / 4;

            // 收集网关支持的 (kdf,aead)
            int[] kdfs  = new int[m];
            int[] aeads = new int[m];
            for (int i = 0; i < m; i++) {
                kdfs[i]  = Short.toUnsignedInt(e.getShort());
                aeads[i] = Short.toUnsignedInt(e.getShort());
            }
            // 选择与客户端偏好匹配的一组
            int chosenKdf = -1, chosenAead = -1;
            outer:
            for (int[] pref : preferred) {
                int wantKdf = pref[0], wantA = pref[1];
                for (int i = 0; i < m; i++) {
                    if (kdfs[i] == wantKdf && aeads[i] == wantA) {
                        chosenKdf = wantKdf; chosenAead = wantA;
                        break outer;
                    }
                }
            }
            if (chosenKdf == -1) {
                // 退一步：接受网关提供的第一组
                if (m > 0) { chosenKdf = kdfs[0]; chosenAead = aeads[0]; }
            }
            if (chosenKdf != -1) {
                // 选中这一条 entry：构造 7 字节“请求线头”的配置
                OHttpHeaderKeyConfig header = new OHttpHeaderKeyConfig(keyId, kemId, chosenKdf, chosenAead);

                // 可选：把公钥持久化为 PEM（Base64 原始字节，不要多余换行/空格）
                String pemType = kemId == HpkeKem.DHKEM_X25519_HKDF_SHA256
                        ? "X25519 PUBLIC KEY" : "EC PUBLIC KEY";
                String base64 = java.util.Base64.getEncoder().encodeToString(publicKey);
                String pem = "-----BEGIN " + pemType + "-----\n" + base64 + "\n-----END " + pemType + "-----\n";
                Files.write(Paths.get("./ohttp_pub.pem"), pem.getBytes(java.nio.charset.StandardCharsets.US_ASCII));

                return new KeyConfigResult(header, publicKey);
            }
        }

        throw new IOException("no compatible ohttp key config found");
    }

    private static byte[] buildBHttpRequest(String code, String verifier, String idpBase) throws IOException {
        // 提取域名和协议
        URL idpUrl = new URL(idpBase);
        String scheme = idpUrl.getProtocol();
        String authority = idpUrl.getAuthority();

        //  组装待签名参数（不含 client_assertion）
        Map<String,String> params = new HashMap<>();
        params.put("grant_type", "authorization_code");
        params.put("code", code);
        params.put("client_id", "anonymous");
        params.put("client_secret", "public");
        params.put("code_verifier", verifier);

        // 规范化并签名
        String toSign = sdk.Tools.FormUtil.canonicalForSigning(params);
        // 匿名认证模式:auto|ring|pptoken(auto模式是先尝试ring然后尝试pptoken)
        AnonSigResult ar = AnonymousSignatureModule.buildAssertionOrPptoken(toSign,"auto");

//        System.out.println("[sig] mode=" + ar.assertionType
//                + ", assertion.len=" + (ar.clientAssertion == null ? -1 : ar.clientAssertion.length())
//                + ", hasAuthz=" + (ar.authorizationHeader != null && !ar.authorizationHeader.isEmpty()));

        // 签名作为表单字段
        params.put("client_assertion_type", ar.assertionType);     // "ring" 或 "pptoken"
        params.put("client_assertion", ar.clientAssertion);

        // 编码为最终的请求体
        byte[] body = sdk.Tools.FormUtil.encodeBody(params);

        BinaryHttpRequest bReq = new BinaryHttpRequest()
                .setMethod("POST")
                .setScheme(scheme)
                .setAuthority(authority)
                .setPath("/openid-connect-server-webapp/code4token");  // token endpoint 路径

        bReq.addHeaderField(new BinaryHttpMessage.Field("content-type", "application/x-www-form-urlencoded"));

        // pptoken分支
        if ("pptoken".equals(ar.assertionType) && ar.authorizationHeader != null && !ar.authorizationHeader.isEmpty()) {
            bReq.addHeaderField(new BinaryHttpMessage.Field("authorization", ar.authorizationHeader));
        }

        bReq.setBody(body);
        return bReq.serialize();
    }

    // 根据 KEM 决定公钥/enc 的字节长度（常见 DHKEM）
    private static int getNpkByKem(int kemId) {
        switch (kemId) {
            case HpkeKem.DHKEM_X25519_HKDF_SHA256:
                return 32;
            // 如需支持 NIST 曲线，可采用非压缩点长度
            // case HpkeKem.DHKEM_P256_HKDF_SHA256: return 65;
            // case HpkeKem.DHKEM_P384_HKDF_SHA384: return 97;
            // case HpkeKem.DHKEM_P521_HKDF_SHA512: return 133;
            default:
                throw new IllegalArgumentException("Unsupported KEM id: " + kemId);
        }
    }
}