package sdk.ohttp;


import org.bouncycastle.crypto.CipherParameters;
import org.bouncycastle.crypto.Mac;
import org.bouncycastle.crypto.digests.SHA256Digest;
import org.bouncycastle.crypto.digests.SHA384Digest;
import org.bouncycastle.crypto.digests.SHA512Digest;
import org.bouncycastle.crypto.macs.HMac;
import org.bouncycastle.crypto.modes.AEADBlockCipher;
import org.bouncycastle.crypto.modes.ChaCha20Poly1305;
import org.bouncycastle.crypto.modes.GCMBlockCipher;
import org.bouncycastle.crypto.params.AEADParameters;
import org.bouncycastle.crypto.params.KeyParameter;
import org.bouncycastle.crypto.params.ParametersWithIV;
import org.bouncycastle.util.Arrays;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

public class OHttpResponse {
    private final byte[] ciphertext; // 服务端填充
    private final byte[] plaintext;  // 客户端填充

    private static final byte[] AAD_EMPTY = new byte[0];
	private static final byte[] RESP_LABEL =
		"message/bhttp response".getBytes(StandardCharsets.US_ASCII);

    private OHttpResponse(byte[] ciphertext, byte[] plaintext) {
        this.ciphertext = ciphertext;
        this.plaintext = plaintext;
    }

    // ========= 服务端逻辑 =========
    public static OHttpResponse createServerOHttpResponse(
            byte[] plaintext,
            OHttpRequest.Context serverContext,
			OHttpHeaderKeyConfig keyConfig,
			SecureRandom rnd
    ) throws Exception {
        if (plaintext == null || plaintext.length == 0) {
            throw new IllegalArgumentException("Plaintext response is empty");
        }

		// 1) 取 AEAD/Nk/Nn 与 HKDF(Mac) 算法
		AeadParams aead = AeadParams.from(keyConfig.getAeadId());
		HkdfParams hkdf = HkdfParams.from(keyConfig.getKdfId());
		int prefixLen = Math.max(aead.Nk, aead.Nn);

		// 2) 生成 response_nonce
		byte[] responseNonce = new byte[prefixLen];
		rnd.nextBytes(responseNonce);

		// 3) Export -> Extract -> Expand
		byte[] secret = serverContext.getContext().export(RESP_LABEL, prefixLen);
		byte[] salt = concat(serverContext.getEnc(), responseNonce);
		byte[] prk  = hkdf.extract(hkdf.newMac(), salt, secret);
		byte[] key  = hkdf.expand(hkdf.newMac(), prk, "key",   aead.Nk);
		byte[] n10  = hkdf.expand(hkdf.newMac(), prk, "nonce", aead.Nn);

		// 4) AEAD 加密 bHTTP 响应
		byte[] ct = aead.seal(key, n10, AAD_EMPTY, plaintext);

		// 5) 线格式：nonce || ct
		byte[] wire = concat(responseNonce, ct);
		return new OHttpResponse(wire, null);
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
            OHttpRequest.Context requestContext,
			OHttpHeaderKeyConfig keyConfig
    ) throws Exception {
        if (encryptedResponse == null || encryptedResponse.length == 0) {
            throw new IllegalArgumentException("Encrypted response is empty");
        }

		AeadParams aead = AeadParams.from(keyConfig.getAeadId());
		HkdfParams hkdf = HkdfParams.from(keyConfig.getKdfId());
		int prefixLen = Math.max(aead.Nk, aead.Nn);
		if (encryptedResponse.length < prefixLen) {
			throw new IllegalArgumentException("ohttp-res too short");
		}

		byte[] responseNonce = Arrays.copyOfRange(encryptedResponse, 0, prefixLen);
		byte[] ct            = Arrays.copyOfRange(encryptedResponse, prefixLen, encryptedResponse.length);

		// Export -> Extract -> Expand（客户端与网关同规）
		byte[] secret = requestContext.getContext().export(RESP_LABEL, prefixLen);
		byte[] salt   = concat(requestContext.getEnc(), responseNonce);
		byte[] prk    = hkdf.extract(hkdf.newMac(), salt, secret);
		byte[] key    = hkdf.expand(hkdf.newMac(), prk, "key",   aead.Nk);
		byte[] n10    = hkdf.expand(hkdf.newMac(), prk, "nonce", aead.Nn);


		byte[] plain = aead.open(key, n10, AAD_EMPTY, ct);
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

	private static byte[] concat(byte[] a, byte[] b) {
		byte[] r = new byte[a.length + b.length];
		System.arraycopy(a, 0, r, 0, a.length);
		System.arraycopy(b, 0, r, a.length, b.length);
		return r;
	}

	/** HKDF 参数（选择 HMAC 种类） */
	static final class HkdfParams {
		final String macAlg; // "HmacSHA256"/"HmacSHA384"/"HmacSHA512"
		HkdfParams(String macAlg) { this.macAlg = macAlg; }

		static HkdfParams from(int kdfId) {
			// HPKE KDF registry: 0x0001=HKDF-SHA256, 0x0002=HKDF-SHA384, 0x0003=HKDF-SHA512
			switch (kdfId) {
				case 0x0001: return new HkdfParams("HmacSHA256");
				case 0x0002: return new HkdfParams("HmacSHA384");
				case 0x0003: return new HkdfParams("HmacSHA512");
				default: throw new IllegalArgumentException("Unsupported KDF id: " + kdfId);
			}
		}

		Mac newMac() {
			switch (macAlg) { // macAlg 是 "HmacSHA256"/"HmacSHA384"/"HmacSHA512"
				case "HmacSHA256":
					return new HMac(new SHA256Digest());
				case "HmacSHA384":
					return new HMac(new SHA384Digest());
				case "HmacSHA512":
					return new HMac(new SHA512Digest());
				default:
					throw new IllegalArgumentException("Unsupported HMAC: " + macAlg);
			}
		}
		byte[] extract(Mac mac, byte[] salt, byte[] ikm) {
			mac.init(new KeyParameter(salt));
			mac.update(ikm, 0, ikm.length);
			byte[] prk = new byte[mac.getMacSize()];
			mac.doFinal(prk, 0);
			return prk;
		}

		byte[] expand(Mac mac, byte[] prk, String info, int len) {
			byte[] infoBytes = info.getBytes(StandardCharsets.US_ASCII);
			mac.init(new KeyParameter(prk));
			byte[] out = new byte[len];
			byte[] t = new byte[0];
			int pos = 0, ctr = 1;
			while (pos < len) {
				mac.update(t, 0, t.length);
				mac.update(infoBytes, 0, infoBytes.length);
				mac.update((byte) ctr);
				t = new byte[mac.getMacSize()];
				mac.doFinal(t, 0);
				int take = Math.min(t.length, len - pos);
				System.arraycopy(t, 0, out, pos, take);
				pos += take;
				mac.reset();
				mac.init(new KeyParameter(prk));
				ctr++;
			}
			return out;
		}
	}

	/** AEAD 参数与实现（与 HPKE AEAD 对齐） */
	static final class AeadParams {
		final int Nk; // key bytes
		final int Nn; // nonce bytes
		final int id; // HPKE AEAD id

		private AeadParams(int id, int Nk, int Nn) { this.id = id; this.Nk = Nk; this.Nn = Nn; }

		static AeadParams from(int aeadId) {
			// HPKE AEAD registry: 0x0001=AES-128-GCM, 0x0002=AES-256-GCM, 0x0003=ChaCha20/Poly1305
			switch (aeadId) {
				case 0x0001: return new AeadParams(0x0001, 16, 12);
				case 0x0002: return new AeadParams(0x0002, 32, 12);
				case 0x0003: return new AeadParams(0x0003, 32, 12);
				default: throw new IllegalArgumentException("Unsupported AEAD id: " + aeadId);
			}
		}

		byte[] seal(byte[] key, byte[] nonce, byte[] aad, byte[] pt) throws Exception {
			return aead(key, nonce, aad, pt, true);
		}
		byte[] open(byte[] key, byte[] nonce, byte[] aad, byte[] ct) throws Exception {
			return aead(key, nonce, aad, ct, false);
		}

		private byte[] aead(byte[] key, byte[] nonce, byte[] aad, byte[] in, boolean forEncrypt) throws Exception {
			switch (id) {
				case 0x0001:
				case 0x0002: {
					AEADBlockCipher gcm = new GCMBlockCipher(new org.bouncycastle.crypto.engines.AESFastEngine());
					CipherParameters params = new AEADParameters(new KeyParameter(key), 128, nonce, aad);
					gcm.init(forEncrypt, params);
					byte[] out = new byte[gcm.getOutputSize(in.length)];
					int n = gcm.processBytes(in, 0, in.length, out, 0);
					n += gcm.doFinal(out, n);
					return out;
				}
				case 0x0003: {
					ChaCha20Poly1305 ch = new ChaCha20Poly1305();
					ch.init(forEncrypt, new ParametersWithIV(new KeyParameter(key), nonce));
					ch.processAADBytes(aad, 0, aad.length);
					byte[] out = new byte[ch.getOutputSize(in.length)];
					int n = ch.processBytes(in, 0, in.length, out, 0);
					n += ch.doFinal(out, n);
					return out;
				}
				default: throw new IllegalStateException();
			}
		}
	}


}
