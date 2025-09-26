package sdk.ohttp;

import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.hpke.*;
import org.bouncycastle.crypto.params.AsymmetricKeyParameter;
import org.bouncycastle.util.Arrays;

/**
 * OHTTP Request 封装 & 解析
 * 支持客户端封装请求、服务端解析请求
 */
public class OHttpRequest {
    private final byte[] encapsulatedKey;
    private final byte[] ciphertext;
    private final OHttpHeaderKeyConfig keyConfig;

    private OHttpRequest(byte[] encapsulatedKey, byte[] ciphertext, OHttpHeaderKeyConfig keyConfig) {
        this.encapsulatedKey = encapsulatedKey;
        this.ciphertext = ciphertext;
        this.keyConfig = keyConfig;
    }

    public static class Context {
        private final HPKEContext context;

        public Context(HPKEContext context) {
            this.context = context;
        }

        public byte[] open(byte[] ciphertext) throws Exception {
            return context.open(ciphertext, null);
        }

        public byte[] seal(byte[] plaintext) throws Exception {
            return context.seal(plaintext, null);
        }
    }

    // ========== 客户端逻辑 ==========
    /**
     * 创建客户端请求
     */
    public static Pair<OHttpRequest, Context> createClientOHttpRequest(
            byte[] plaintextPayload,
            byte[] hpkePublicKey,
            OHttpHeaderKeyConfig keyConfig,
            String requestLabel
    ) throws Exception {
        if (plaintextPayload == null || plaintextPayload.length == 0) {
            throw new IllegalArgumentException("Plaintext payload is empty");
        }
        if (hpkePublicKey == null || hpkePublicKey.length == 0) {
            throw new IllegalArgumentException("HPKE public key is empty");
        }

        keyConfig.validate();

        // 创建 HPKE 实例
        byte mode = 0x01; // 例如，0x01 代表 Base 模式
        short kemId = (short) keyConfig.getKemId();
        short kdfId = (short) keyConfig.getKdfId();
        short aeadId = (short) keyConfig.getAeadId();
        HPKE hpke = new HPKE(mode, kemId, kdfId, aeadId);

        // 从 bytes 构造公钥参数
        AsymmetricKeyParameter pkR = hpke.deserializePublicKey(hpkePublicKey);

        // info = SerializeRecipientContextInfo(request_label)
        byte[] info = keyConfig.serializeRecipientContextInfo(requestLabel);

        // setup sender
        HPKEContextWithEncapsulation sender = hpke.setupBaseS(pkR, info);

        byte[] encapsulatedKey = sender.getEncapsulation();
        byte[] ciphertext = sender.seal(plaintextPayload, null);

        OHttpRequest request = new OHttpRequest(encapsulatedKey, ciphertext, keyConfig);
        Context ctx = new Context(sender);

        return Pair.of(request, ctx);
    }

    /**
     * Encapsulate and serialize into OHTTP wire format
     * request = [hdr || enc || ct]
     */
    public byte[] encapsulateAndSerialize() {
        byte[] header = keyConfig.serializePayloadHeader();
        byte[] result = new byte[header.length + encapsulatedKey.length + ciphertext.length];

        System.arraycopy(header, 0, result, 0, header.length);
        System.arraycopy(encapsulatedKey, 0, result, header.length, encapsulatedKey.length);
        System.arraycopy(ciphertext, 0, result, header.length + encapsulatedKey.length, ciphertext.length);

        return result;
    }

    // ========== 服务端逻辑 ==========
    public static OHttpRequest parseWire(byte[] wire) throws Exception {
        // header 固定 7 字节 (rfc9458 定义)
        byte[] header = Arrays.copyOfRange(wire, 0, 7);
        OHttpHeaderKeyConfig keyConfig = OHttpHeaderKeyConfig.parsePayloadHeader(header);

        // 解析 encapsulated key
        int encLen = keyConfig.getEncLength();
        byte[] enc = Arrays.copyOfRange(wire, 7, 7 + encLen);

        // 解析 ciphertext
        byte[] ct = Arrays.copyOfRange(wire, 7 + encLen, wire.length);

        // 构造 request 对象
        return new OHttpRequest(enc, ct, keyConfig);
    }

    /**
     * 服务端解密 OHTTP 请求
     */
    public byte[] decryptWithServerKey(AsymmetricCipherKeyPair serverKeyPair, String requestLabel) throws Exception {

        keyConfig.validate();

        // 初始化 HPKE
        byte mode = 0x01; // Base 模式
        short kemId = (short) keyConfig.getKemId();
        short kdfId = (short) keyConfig.getKdfId();
        short aeadId = (short) keyConfig.getAeadId();
        HPKE hpke = new HPKE(mode, kemId, kdfId, aeadId);

        // 构造 info
        byte[] info = keyConfig.serializeRecipientContextInfo(requestLabel);

        // 服务端 setup receiver
        HPKEContext receiver = hpke.setupBaseR(encapsulatedKey, serverKeyPair, info);

        // 解密 ciphertext 得到原始请求
        return receiver.open(ciphertext, null);
    }

    // ========== Getter ==========
    public byte[] getCiphertext() {
        return ciphertext;
    }

    public byte[] getEncapsulatedKey() {
        return encapsulatedKey;
    }
}
