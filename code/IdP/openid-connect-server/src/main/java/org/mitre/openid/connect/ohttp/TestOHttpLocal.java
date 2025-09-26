package org.mitre.openid.connect.ohttp;

import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.params.X25519PublicKeyParameters;

import java.nio.charset.StandardCharsets;

public class TestOHttpLocal {
    public static void main(String[] args) throws Exception {
        System.out.println("=== 本地 OHTTP 测试（从 PEM 文件读取公私钥） ===");

        // 1️⃣ 加载服务器长期 HPKE 密钥对（公钥+私钥）
        AsymmetricCipherKeyPair serverKp = HpkeKeyUtil.loadKeyPairFromPem("ohttp_pub.pem", "ohttp_priv.pem");
        X25519PublicKeyParameters serverPub = (X25519PublicKeyParameters) serverKp.getPublic();

        System.out.println("[DEBUG] 公钥长度: " + serverPub.getEncoded().length);

        // OHTTP KeyConfig (假设使用默认配置)
        OHttpHeaderKeyConfig keyConfig = OHttpHeaderKeyConfig.defaultConfig();

        System.out.println("[DEBUG] keyConfig = " + keyConfig);


        // 2️⃣ 构造一个 bHTTP 请求
        String httpPlain = "GET /test HTTP/1.1\r\nHost: example.com\r\n\r\n";
        byte[] plaintextRequest = httpPlain.getBytes(StandardCharsets.UTF_8);
        System.out.println("[Client] 原始HTTP请求: " + httpPlain);

        // 3️⃣ 客户端封装 OHTTP 请求
        Pair<OHttpRequest, OHttpRequest.Context> pair = OHttpRequest.createClientOHttpRequest(
                plaintextRequest,
                serverPub.getEncoded(),   // 从 PEM 读取的公钥
                keyConfig,
                "ohttp request"
        );
        OHttpRequest clientReq = pair.getLeft();
        OHttpRequest.Context clientCtx = pair.getRight(); // 保存 context 解密响应用
        byte[] wireRequest = clientReq.encapsulateAndSerialize();
        System.out.println("[Client] OHTTP 封装后请求长度: " + wireRequest.length + " 字节");

        // 4️⃣ 服务器收到 OHTTP 请求并解密
        OHttpRequest parsedReq = OHttpRequest.parseWire(wireRequest);
        OHttpRequest.Context serverCtx = parsedReq.buildServerContext(serverKp, "ohttp request");
        byte[] decryptedHttp = serverCtx.open(parsedReq.getCiphertext());
        System.out.println("[Server] 解密得到HTTP请求:\n" + new String(decryptedHttp, StandardCharsets.UTF_8));

        // 5️⃣ 服务器生成响应并加密
        String httpResp = "HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nhello";
        byte[] plainResponse = httpResp.getBytes(StandardCharsets.UTF_8);
        OHttpResponse serverResp = OHttpResponse.createServerOHttpResponse(plainResponse, serverCtx);
        byte[] encryptedResp = serverResp.serialize();
        System.out.println("[Server] OHTTP 加密响应长度: " + encryptedResp.length + " 字节");

        // 6️⃣ 客户端用之前的 context 解密响应
        OHttpResponse clientResp = OHttpResponse.createClientOHttpResponse(encryptedResp, clientCtx);
        String decryptedResponse = new String(clientResp.getPlaintext(), StandardCharsets.UTF_8);
        System.out.println("[Client] 解密得到HTTP响应:\n" + decryptedResponse);

        System.out.println("=== 测试完成 ===");
    }
}
