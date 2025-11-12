package org.mitre.openid.connect.Ring;

import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.StringJoiner;

public final class RingAuthorityInit {
	/** 主入口：初始化一个包含 5 个成员的环到 baseDir */
	public static void main(String[] args) throws Exception {
		Path baseDir = Paths.get("ring_store");   // 例如：D:/.../ring_store
		int n = 5;                             // 初始成员数

		// 1) 调用 RingKeyStore 完成环初始化（生成并落盘所有需要的材料）
		RingKeyStore ks = new RingKeyStore(baseDir, n);
		ks.generateAndSave();
		ks.assertPublicKeysExist(); // 生成后做一次公钥存在性自检
	}
}
