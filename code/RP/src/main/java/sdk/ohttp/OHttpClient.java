package sdk.ohttp;

import com.google.gson.Gson;
import org.bouncycastle.asn1.edec.EdECObjectIdentifiers;
import org.bouncycastle.asn1.sec.ECPrivateKey;
import org.bouncycastle.asn1.x509.AlgorithmIdentifier;
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.crypto.digests.SHA256Digest;
import org.bouncycastle.crypto.generators.HKDFBytesGenerator;
import org.bouncycastle.crypto.params.HKDFParameters;


import javax.crypto.*;
import javax.crypto.spec.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.X509EncodedKeySpec;
import java.util.*;

public final class OHttpClient {

    private static final String RELAY_URL = OHttpConfig.RELAY_URL;
    private static final String GATEWAY_KEY_URL = OHttpConfig.KEY_CONFIG_URL;
    private static final String GATEWAY = OHttpConfig.GATEWAY_ORIGIN;

    private final ECPublicKey gatewayKey;

    public OHttpClient() throws Exception {
        Security.addProvider(new BouncyCastleProvider());
        this.gatewayKey = fetchGatewayKey(GATEWAY_KEY_URL);
    }

    public Map<String, String > postForm(String path, Map<String, String> form, Map<String, String> extraHeaders)
            throws Exception{

        ECPublicKey gatewayKey = fetchGatewayKey(GATEWAY_KEY_URL);

        // 明文 HTTP 转 二进制 HTTP
        byte[] plainHttp = BinaryHttp.encode(
                "POST",
                GATEWAY,
                path,
                mergeHeaders(extraHeaders),
                formEncode(form).getBytes(StandardCharsets.UTF_8));

        // HPKE 封装
        byte[] sealed = hpkeSeal(plainHttp);

        // 发送给 relay 服务器
        HttpURLConnection http = (HttpURLConnection) new URL(RELAY_URL).openConnection();
        http.setRequestMethod("POST");
        http.setDoOutput(true);
        http.setRequestProperty("Content-Type", "application/ohttp");
        http.setConnectTimeout(5_000);
        http.setReadTimeout(10_000);

        try (OutputStream out = http.getOutputStream()) {
            out.write(sealed);
        }

        // 获取返回包
        byte[] sealedResp;
        try (InputStream in = http.getInputStream()) {
            sealedResp = readFully(in);
        }

        // HPKE 解封装
        byte[] plainResp = hpkeOpen(sealedResp);

        BinaryHttp.Response httpResp = BinaryHttp.decode(plainResp);
        return new Gson().fromJson(new String(httpResp.body), Map.class);
    }


    private ECPublicKey fetchGatewayKey(String keyUrl) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(keyUrl).openConnection();
        conn.setRequestMethod("GET");
        try (InputStream in = conn.getInputStream()) {
            byte[] raw32 = Base64.getDecoder().decode(new String(readFully(in)).trim());
            KeyFactory kf = KeyFactory.getInstance("X25519", "BC");
            X509EncodedKeySpec spec = new X509EncodedKeySpec(
                    new SubjectPublicKeyInfo(
                            new AlgorithmIdentifier(EdECObjectIdentifiers.id_X25519), raw32)
                            .getEncoded());
            return (ECPublicKey) kf.generatePublic(spec);
        }
    }

    private byte[] hpkeSeal(byte[] plain) throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("X25519", "BC");
        KeyPair ephemeral = kpg.generateKeyPair();
        ECPublicKey  pubEphemeral  = (ECPublicKey) ephemeral.getPublic();
        ECPrivateKey privEphemeral = (ECPrivateKey) ephemeral.getPrivate();

        byte[] shared = deriveSharedSecret((PrivateKey) privEphemeral, gatewayKey);
        byte[] key   = hkdf(shared, 16);
        byte[] nonce = hkdf(shared, 12);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding", "BC");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"),
                new GCMParameterSpec(128, nonce));
        byte[] cipherText = cipher.doFinal(plain);

        byte[] enc = pubEphemeral.getQ().getEncoded(false); // 32 字节裸点
        byte[] out = new byte[enc.length + cipherText.length];
        System.arraycopy(enc, 0, out, 0, enc.length);
        System.arraycopy(cipherText, 0, out, enc.length, cipherText.length);
        return out;
    }

    private byte[] hpkeOpen(byte[] sealed) throws Exception {
        int encLen = 32;
        byte[] enc = new byte[encLen];
        byte[] cipherText = new byte[sealed.length - encLen];
        System.arraycopy(sealed, 0, enc, 0, encLen);
        System.arraycopy(sealed, encLen, cipherText, 0, cipherText.length);

        KeyFactory kf = KeyFactory.getInstance("X25519", "BC");
        X509EncodedKeySpec spec = new X509EncodedKeySpec(
                new SubjectPublicKeyInfo(
                        new AlgorithmIdentifier(EdECObjectIdentifiers.id_X25519), enc)
                        .getEncoded());
        ECPublicKey pubEphemeral = (ECPublicKey) kf.generatePublic(spec);

        byte[] shared = deriveSharedSecret(null, pubEphemeral); // 用网关私钥？这里简化：双方用同一密钥
        byte[] key   = hkdf(shared, 16);
        byte[] nonce = hkdf(shared, 12);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding", "BC");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"),
                new GCMParameterSpec(128, nonce));
        return cipher.doFinal(cipherText);
    }

    private byte[] deriveSharedSecret(PrivateKey priv, ECPublicKey pub) throws Exception {
        KeyAgreement ka = KeyAgreement.getInstance("X25519", "BC");
        ka.init(priv == null ? gatewayKey : priv);   // 简化：网关侧用自身私钥
        ka.doPhase(pub, true);
        return ka.generateSecret();
    }

    private byte[] hkdf(byte[] shared, int len) throws Exception {
        HKDFBytesGenerator hkdf = new HKDFBytesGenerator(new SHA256Digest());
        hkdf.init(new HKDFParameters(shared, null, "ohttp v1".getBytes(StandardCharsets.UTF_8)));
        byte[] out = new byte[len];
        hkdf.generateBytes(out, 0, len);
        return out;
    }

    private Map<String, String> mergeHeaders(Map<String, String> extra) {
        Map<String, String> h = new LinkedHashMap<>();
        h.put("content-type", "application/x-www-form-urlencoded");
        h.putAll(extra);
        return h;
    }

    private String formEncode(Map<String, String> map) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : map.entrySet()) {
            if (sb.length() > 0) sb.append('&');
            sb.append(e.getKey()).append('=').append(e.getValue());
        }
        return sb.toString();
    }

    private static byte[] readFully(InputStream in) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = in.read(buf)) != -1) bos.write(buf, 0, n);
        return bos.toByteArray();
    }
}
