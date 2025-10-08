package sdk.ohttp;

import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.hpke.HPKE;
import org.bouncycastle.crypto.hpke.HPKEContext;
import org.bouncycastle.crypto.hpke.HPKEContextWithEncapsulation;
import org.bouncycastle.crypto.params.AsymmetricKeyParameter;
import org.bouncycastle.util.Arrays;

import java.nio.charset.StandardCharsets;

/**
 * OHTTP Request 封装 & 解析
 * 支持客户端封装请求、服务端解析请求
 */
public class OHttpRequest {
    private final byte[] encapsulatedKey;
    private final byte[] ciphertext;
    private final OHttpHeaderKeyConfig keyConfig;

    private static final byte[] AAD_EMPTY = new byte[0];
	private static final byte[] REQ_LABEL =
		"message/bhttp request".getBytes(StandardCharsets.US_ASCII);

    private OHttpRequest(byte[] encapsulatedKey, byte[] ciphertext, OHttpHeaderKeyConfig keyConfig) {
        this.encapsulatedKey = encapsulatedKey;
        this.ciphertext = ciphertext;
        this.keyConfig = keyConfig;
    }

	public static class Context {
		private final HPKEContext context;
		private final byte[] enc;

		public Context(HPKEContext context, byte[] enc) {
			this.context = context;
			this.enc = enc;
		}

		public HPKEContext getContext() { return context; }
		public byte[] getEnc() { return enc; }


		public byte[] open(byte[] ciphertext) throws Exception {
			return context.open(AAD_EMPTY, ciphertext);
		}

		public byte[] seal(byte[] plaintext) throws Exception {
			return context.seal(AAD_EMPTY, plaintext);
		}
	}

    // ========== 客户端逻辑 ==========
    /**
     * 创建客户端请求
     */
	public static Pair<OHttpRequest, Context> createClientOHttpRequest(
		byte[] plaintextPayload,
		byte[] hpkePublicKey,
		OHttpHeaderKeyConfig keyConfig
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

		// setup sender
		HPKEContextWithEncapsulation sender = hpke.setupBaseS(pkR, REQ_LABEL);

		byte[] encapsulatedKey = sender.getEncapsulation();

		byte[] ciphertext = sender.seal(AAD_EMPTY, plaintextPayload);

		OHttpRequest request = new OHttpRequest(encapsulatedKey, ciphertext, keyConfig);
		Context ctx = new Context(sender, encapsulatedKey);

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
	public byte[] decryptWithServerKey(AsymmetricCipherKeyPair serverKeyPair) throws Exception {

		keyConfig.validate();

		// 初始化 HPKE
		byte mode = 0x01; // Base 模式
		short kemId = (short) keyConfig.getKemId();
		short kdfId = (short) keyConfig.getKdfId();
		short aeadId = (short) keyConfig.getAeadId();
		HPKE hpke = new HPKE(mode, kemId, kdfId, aeadId);

		// 服务端 setup receiver
		HPKEContext receiver = hpke.setupBaseR(encapsulatedKey, serverKeyPair, REQ_LABEL);

		// 解密 ciphertext 得到原始请求
		return receiver.open(AAD_EMPTY, ciphertext);
	}


	/**
     * 服务端用私钥重建 HPKE Context (receiver)，返回 Context 以便加密响应
     */
    public Context buildServerContext(AsymmetricCipherKeyPair serverKeyPair) throws Exception {
        keyConfig.validate();

        HPKE hpke = new HPKE((byte)0x01, (short) keyConfig.getKemId(),
                (short) keyConfig.getKdfId(), (short) keyConfig.getAeadId());

        HPKEContext receiver = hpke.setupBaseR(encapsulatedKey, serverKeyPair, REQ_LABEL);

        return new Context(receiver, encapsulatedKey);
    }

    // ========== Getter ==========
    public byte[] getCiphertext() {
        return ciphertext;
    }

    public byte[] getEncapsulatedKey() {
        return encapsulatedKey;
    }
}
