package org.mitre.openid.connect.ohttp;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.ByteBuffer;

@RestController
public class OHttpKeyConfigController {

	private final byte[] keyConfigDoc;

	public OHttpKeyConfigController() throws Exception {
		// 这里用你在 Gateway 中一样的 keyConfig，确保公钥和 KEM/KDF/AEAD 参数一致
		OHttpHeaderKeyConfig cfg = OHttpHeaderKeyConfig.defaultConfig();

		byte[] pubKey = HpkeKeyUtil.loadPublicKeyBytes("./ohttp_pub.pem");
		// 声明支持的 (KDF, AEAD) 组合（可列多个）
		int[][] kdfAeadPairs = new int[][]{
			{ HpkeKdf.HKDF_SHA256, HpkeAead.AES_128_GCM },
		};

		// 构造单条 entry
		byte[] entryBody = buildKeyConfigEntryBody(cfg.getKeyId(), cfg.getKemId(), pubKey, kdfAeadPairs);

		// 前置 2 字节长度（网络字节序），形成最终文档
		ByteBuffer doc = ByteBuffer.allocate(2 + entryBody.length);
		doc.putShort((short) entryBody.length);
		doc.put(entryBody);
		this.keyConfigDoc = doc.array();
	}

	@GetMapping(value = "/.well-known/ohttp-gateway-key", produces = "application/ohttp-keys")
	public ResponseEntity<byte[]> getKeyConfig() {
		// 返回完整的 KeyConfigDoc
		return ResponseEntity.ok(keyConfigDoc);
	}

	// ========= 辅助函数：构造单条 entry 的内部体 =========
	private static byte[] buildKeyConfigEntryBody(byte keyId, int kemId, byte[] publicKey, int[][] kdfAeadPairs) {
		if (publicKey == null || publicKey.length == 0) {
			throw new IllegalArgumentException("publicKey empty");
		}
		if (kdfAeadPairs == null || kdfAeadPairs.length == 0) {
			throw new IllegalArgumentException("no (KDF,AEAD) suites");
		}
		int suitesLen = 4 * kdfAeadPairs.length;

		ByteBuffer buf = ByteBuffer.allocate(1 + 2 + publicKey.length + 2 + suitesLen);
		buf.put(keyId);
		buf.putShort((short) kemId);
		buf.put(publicKey);
		buf.putShort((short) suitesLen);
		for (int[] pair : kdfAeadPairs) {
			if (pair == null || pair.length != 2) {
				throw new IllegalArgumentException("bad suite pair");
			}
			buf.putShort((short) pair[0]); // kdf_id
			buf.putShort((short) pair[1]); // aead_id
		}
		return buf.array();
	}

}
