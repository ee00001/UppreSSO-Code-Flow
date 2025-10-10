package sdk;

import com.google.gson.Gson;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import sdk.bhttp.BinaryHttpMessage;
import sdk.bhttp.BinaryHttpRequest;
import sdk.bhttp.BinaryHttpResponse;
import sdk.ohttp.OHttpClient;
import sdk.ohttp.OHttpHeaderKeyConfig;
import sdk.ohttp.OHttpResponse;
import sdk.ohttp.PemFileUtil;

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

    public static Map<String, String> exchangeCodeForToken(
            String code, String idpDomain, String verifier) throws Exception {

        //  拉取/缓存公钥
        byte[] pubKey = getOrFetchServerPubKey(idpDomain);

        // 构造 bHTTP 请求
        byte[] bhttp = buildBHttpRequest(code, verifier, idpDomain);

        // 通过 OHTTP 客户端发往 IdP 的 /gateway
        OHttpClient ohttpClient = new OHttpClient(OHttpHeaderKeyConfig.defaultConfig(), pubKey);

        byte[] plaintextResp = ohttpClient.sendOHttpRequest(bhttp, RELAY_URL);


        BinaryHttpResponse bresp = BinaryHttpResponse.deserialize(plaintextResp);

        String json = new String(bresp.getBody(), StandardCharsets.UTF_8);
        return new Gson().fromJson(json, Map.class);

    }

    private static byte[] getOrFetchServerPubKey(String idpDomain) throws IOException {
        File f = new File("./ohttp_pub.pem");
        if (f.exists()) {
            return PemFileUtil.readPem("./ohttp_pub.pem");
        }
        // 没有就从 IdP 获取
        String keyUrl = idpDomain + "/openid-connect-server-webapp" + "/.well-known/ohttp-gateway-key";
        HttpURLConnection conn = (HttpURLConnection) new URL(keyUrl).openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Accept", "application/ohttp-keys");

        byte[] cfg;
        try (InputStream is = conn.getInputStream();
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[4096];
            int len;
            while ((len = is.read(buf)) != -1) {
                bos.write(buf, 0, len);
            }
            cfg = bos.toByteArray();
        }

        // 解析 keyconfig，提取公钥
        ByteBuffer buf = ByteBuffer.wrap(cfg);
        buf.get(); // keyId
        buf.getShort(); // kem
        buf.getShort(); // kdf
        buf.getShort(); // aead
        byte[] pubKey = new byte[buf.remaining()];
        buf.get(pubKey);

        // 转成 PEM 并保存
        String base64 = java.util.Base64.getEncoder().encodeToString(pubKey);
        String pem = "-----BEGIN X25519 PUBLIC KEY-----\n"
                + base64 + "\n-----END X25519 PUBLIC KEY-----\n";
        Files.write(Paths.get("./ohttp_pub.pem"), pem.getBytes(StandardCharsets.US_ASCII));

        return pubKey;
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
        String assertion = AnonymousSignatureModule.sign(toSign); // 签名模块

        // 签名作为表单字段
        params.put("client_assertion", assertion);

        // 编码为最终的请求体
        byte[] body = sdk.Tools.FormUtil.encodeBody(params);

        BinaryHttpRequest bReq = new BinaryHttpRequest()
                .setMethod("POST")
                .setScheme(scheme)
                .setAuthority(authority)
                .setPath("/openid-connect-server-webapp/code4token");  // token endpoint 路径

        bReq.addHeaderField(new BinaryHttpMessage.Field("content-type", "application/x-www-form-urlencoded"));
        bReq.setBody(body);

        return bReq.serialize();
    }
}