package org.mitre.openid.connect.ohttp;


import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public final class OHttpClient {
    private final OHttpHeaderKeyConfig keyConfig;
    private final byte[] hpkePublicKey;

    public OHttpClient(OHttpHeaderKeyConfig keyConfig, byte[] hpkePublicKey) {
        this.keyConfig = keyConfig;
        this.hpkePublicKey = hpkePublicKey;
    }

    /**
     * 发送一个 OHTTP 请求
     * @param plaintextPayload 原始 bHTTP 格式的请求
     * @param relayUrl OHTTP Relay 的 URL
     * @param requestLabel 用于 HPKE 的 info 标签
     */
    public byte[] sendOHttpRequest(byte[] plaintextPayload, String relayUrl, String requestLabel) throws Exception {
        // 构造 OHTTP Request
        Pair<OHttpRequest, OHttpRequest.Context> pair = OHttpRequest.createClientOHttpRequest(
                plaintextPayload,
                hpkePublicKey,
                keyConfig,
                requestLabel
        );
        OHttpRequest request = pair.getLeft();
        OHttpRequest.Context ctx = pair.getRight();  // 保存 context 用来解密 response

        byte[] wireRequest = request.encapsulateAndSerialize();

        // 发送到 Relay
        HttpURLConnection connection = (HttpURLConnection) new URL(relayUrl).openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "message/ohttp-req");
        connection.setDoOutput(true);

        try (OutputStream os = connection.getOutputStream()) {
            os.write(wireRequest);
        }

        // 接收响应
        int status = connection.getResponseCode();
        if (status != 200) {
            throw new IOException("OHTTP request failed, HTTP status: " + status);
        }

        byte[] encryptedResponse;
        try (InputStream is = connection.getInputStream();
             ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
            byte[] tmp = new byte[4096];
            int read;
            while ((read = is.read(tmp)) != -1) {
                buffer.write(tmp, 0, read);
            }
            encryptedResponse = buffer.toByteArray();
        }

        // 用请求时的 HPKE context 解密响应
        OHttpResponse resp = OHttpResponse.createClientOHttpResponse(encryptedResponse, ctx);
        return resp.getPlaintext();  // 返回解密后的明文响应
    }

}
