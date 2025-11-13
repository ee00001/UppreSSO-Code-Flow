package org.mitre.openid.connect;

import org.mitre.openid.connect.RingInit.RingKeyStore;

import java.nio.file.Path;
import java.util.Base64;

public final class RingVerifier {

	private static native boolean whitelistVerify(
		byte[] sig,
		byte[][] onlinePk33,
		byte[][] offlinePk33,
		byte[] subPk33);

	private static native boolean whitelistVerifyMsg(
		byte[] sig,
		byte[][] onlinePk33,
		byte[][] offlinePk33,
		byte[] subPk33,
		byte[] msg);

	static {
		System.loadLibrary("secp256k1zkp_jni");
	}

	private final byte[]   subPk33;      // 33 字节压缩公钥
	private final byte[][] onlinePk33;   // n × 33
	private final byte[][] offlinePk33;  // n × 33
	private final int      n;

	public RingVerifier(RingKeyStore store) {
		if (store == null) throw new IllegalArgumentException("store == null");
		this.subPk33     = store.loadSubPk();
		this.onlinePk33  = store.loadOnlinePks();
		this.offlinePk33 = store.loadOfflinePks();

		if (subPk33 == null || subPk33.length != 33) {
			throw new IllegalStateException("sub.pk 必须是 33 字节压缩公钥");
		}
		if (onlinePk33 == null || offlinePk33 == null ||
			onlinePk33.length == 0 || onlinePk33.length != offlinePk33.length) {
			throw new IllegalStateException("online/offline 公钥数组为空或数量不一致");
		}
		for (int i = 0; i < onlinePk33.length; i++) {
			requireLen(onlinePk33[i], 33, "online_" + i + ".pk");
			requireLen(offlinePk33[i], 33, "offline_" + i + ".pk");
		}
		this.n = onlinePk33.length;
	}

	public static RingVerifier from(Path ringDir, int n) {
		RingKeyStore ks = new RingKeyStore(ringDir, n);
		ks.assertPublicKeysExist();
		return new RingVerifier(ks);
	}

	public boolean verify(byte[] signature) {
		if (signature == null) throw new IllegalArgumentException("signature == null");
		return whitelistVerify(signature, onlinePk33, offlinePk33, subPk33);
	}

	public boolean verifyB64Url(String signatureB64Url) {
		if (signatureB64Url == null) throw new IllegalArgumentException("signatureB64Url == null");
		byte[] sig = Base64.getUrlDecoder().decode(signatureB64Url);
		return verify(sig);
	}

	public boolean verifyWithMsg(byte[] signature, byte[] msg) {
		if (signature == null) throw new IllegalArgumentException("signature == null");
		if (msg == null) throw new IllegalArgumentException("msg == null");
		return whitelistVerifyMsg(signature, onlinePk33, offlinePk33, subPk33, msg);
	}

	public boolean verifyWithMsgB64Url(String signatureB64Url, byte[] msg) {
		if (signatureB64Url == null) throw new IllegalArgumentException("signatureB64Url == null");
		byte[] sig = Base64.getUrlDecoder().decode(signatureB64Url);
		return verifyWithMsg(sig, msg);
	}

	public int ringSize() { return n; }

	private static void requireLen(byte[] b, int len, String name) {
		if (b == null || b.length != len) {
			throw new IllegalStateException(name + " 长度必须是 " + len + " 字节");
		}
	}
}
