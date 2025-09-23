package sdk.ohttp;

import org.bouncycastle.crypto.hpke.*;
import org.bouncycastle.crypto.params.AsymmetricKeyParameter;

public class OHttpRequest {
    private final byte[] encapsulatedKey;
    private final byte[] ciphertext;
    private final byte[] plaintext;
    private final OHttpHeaderKeyConfig keyConfig;
    private final HPKEContextWithEncapsulation senderContext;

    private OHttpRequest(byte[] encapsulatedKey,
                                 byte[] ciphertext,
                                 byte[] plaintext,
                                 OHttpHeaderKeyConfig keyConfig,
                         HPKEContextWithEncapsulation senderContext) {
        this.encapsulatedKey = encapsulatedKey;
        this.ciphertext = ciphertext;
        this.plaintext = plaintext;
        this.keyConfig = keyConfig;
        this.senderContext = senderContext;
    }

    /**
     * Create a client-side OHTTP request.
     */
    public static OHttpRequest createClientObliviousRequest(
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

        // 创建 HPKE 实例
        byte mode = 0x01; // 例如，0x01 代表 Base 模式
        short kemId = (short) keyConfig.getKemId();
        short kdfId = (short) keyConfig.getKdfId();
        short aeadId = (short) keyConfig.getAeadId();
        HPKE hpke = new HPKE(
                mode,
                kemId,
                kdfId,
                aeadId
        );

        // 从 bytes 构造公钥参数
        AsymmetricKeyParameter pkR = hpke.deserializePublicKey(hpkePublicKeyBytes);

        // info = SerializeRecipientContextInfo(request_label)
        byte[] info = keyConfig.serializeRecipientContextInfo(requestLabel);

        // setup sender
        HPKEContextWithEncapsulation sender = hpke.setupBaseS(pkR, info);

        byte[] encapsulatedKey = sender.getEncapsulation();
        // 加密 payload
        byte[] ciphertext = sender.seal(plaintextPayload, null);

        return new OHttpRequest(
                encapsulatedKey,
                ciphertext,
                plaintextPayload,
                keyConfig,
                sender
        );
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

    public byte[] getPlaintextData() {
        return plaintext;
    }

    public byte[] getCiphertext() {
        return ciphertext;
    }

    public byte[] getEncapsulatedKey() {
        return encapsulatedKey;
    }
}
