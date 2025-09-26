package sdk.ohttp;


public class OHttpResponse {
    private final byte[] ciphertext; // 服务端填充
    private final byte[] plaintext;  // 客户端填充

    private OHttpResponse(byte[] ciphertext, byte[] plaintext) {
        this.ciphertext = ciphertext;
        this.plaintext = plaintext;
    }

    // ========= 服务端逻辑 =========
    public static OHttpResponse createServerOHttpResponse(
            byte[] plaintext,
            OHttpRequest.Context serverContext
    ) throws Exception {
        if (plaintext == null || plaintext.length == 0) {
            throw new IllegalArgumentException("Plaintext response is empty");
        }
        byte[] ct = serverContext.seal(plaintext);
        return new OHttpResponse(ct, null);
    }

    public byte[] serialize() {
        if (ciphertext == null) {
            throw new IllegalStateException("This OHttpResponse contains no ciphertext");
        }
        return ciphertext;
    }

    // ========= 客户端逻辑 =========
    public static OHttpResponse createClientOHttpResponse(
            byte[] encryptedResponse,
            OHttpRequest.Context requestContext
    ) throws Exception {
        if (encryptedResponse == null || encryptedResponse.length == 0) {
            throw new IllegalArgumentException("Encrypted response is empty");
        }
        byte[] plain = requestContext.open(encryptedResponse);
        return new OHttpResponse(null, plain);
    }

    // ========= Getter =========
    /**
     * 客户端获取解密后的明文
     */
    public byte[] getPlaintext() {
        if (plaintext == null) {
            throw new IllegalStateException("This OHttpResponse contains no plaintext");
        }
        return plaintext;
    }

    /**
     * 服务端获取加密后的响应
     */
    public byte[] getCiphertext() {
        if (ciphertext == null) {
            throw new IllegalStateException("This OHttpResponse contains no ciphertext");
        }
        return ciphertext;
    }



}
