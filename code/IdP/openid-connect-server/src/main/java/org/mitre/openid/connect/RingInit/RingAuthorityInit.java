package org.mitre.openid.connect.RingInit;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public final class RingAuthorityInit {
	/** 主入口：初始化一个包含 5 个成员的环到 baseDir */
	public static void main(String[] args) throws Exception {
		Path baseDir = Paths.get("ring_key");
		int n = 5;                             // 初始成员数

		// 调用 RingKeyStore 完成环初始化（生成并落盘所有需要的材料）
		RingKeyStore ks = new RingKeyStore(baseDir, n);
		ks.generateAndSave();
		ks.assertPublicKeysExist(); // 生成后做一次公钥存在性自检

		// 公开材料 -> public.json
		String publicJson = buildPublicJson(baseDir, n);
		IOUtil.writeString(baseDir.resolve("public.json"), publicJson);

		// 环所有者秘密 -> /secret/..
		Path secretDir = baseDir.resolve("secret");
		ensureDir(secretDir);
		IOUtil.copy(baseDir.resolve("sub.sk"), secretDir.resolve("sub.sk"));

		for (int i = 0; i < n; i++) {
			Path out = baseDir.resolve("client_" + i);
			ensureDir(out);

			// 该成员的私钥材料
			IOUtil.copy(baseDir.resolve("online_" + i + ".sk"),  out.resolve("online_" + i + ".sk"));
			IOUtil.copy(baseDir.resolve("summed_" + i + ".sk"),  out.resolve("summed_" + i + ".sk"));

			// 写一个最小配置，指向公共规范 public.json（使用相对路径更易迁移）
			String embeddedCfg = buildEmbeddedClientConfig(baseDir, n, i);
			IOUtil.writeString(out.resolve("client_config.json"), embeddedCfg);
		}

		IOUtil.writeString(baseDir.resolve("ring_members.txt"), renderPublicKeyList(baseDir, n));

		System.out.println("Ring initialized at: " + baseDir.toAbsolutePath());
		System.out.println("Public spec: " + baseDir.resolve("public.json").toAbsolutePath());
		System.out.println("Owner secrets at: " + secretDir.toAbsolutePath());
		System.out.println("Client bundles under: ring_store/client_0 ... client_" + (n - 1));

	}

	private static void ensureDir(Path p) {
		try { Files.createDirectories(p); } catch (Exception e) { throw new RuntimeException(e); }
	}

	private static String buildEmbeddedClientConfig(Path dir, int n, int index) {
		String subPk = IOUtil.readString(dir.resolve("sub.pk"));
		StringBuilder onlineArr = new StringBuilder("[");
		StringBuilder offlineArr = new StringBuilder("[");

		for (int i = 0; i < n; i++) {
			if (i > 0) { onlineArr.append(','); offlineArr.append(','); }
			onlineArr.append('"').append(IOUtil.readString(dir.resolve("online_" + i + ".pk"))).append('"');
			offlineArr.append('"').append(IOUtil.readString(dir.resolve("offline_" + i + ".pk"))).append('"');
		}
		onlineArr.append(']');
		offlineArr.append(']');

		return "{\n" +
			"  \"version\": 1,\n" +
			"  \"index\": " + index + ",\n" +
			"  \"subPk\": \"" + subPk + "\",\n" +
			"  \"n\": " + n + ",\n" +
			"  \"onlinePks\": " + onlineArr + ",\n" +
			"  \"offlinePks\": " + offlineArr + "\n" +
			"}\n";
	}

	private static String buildPublicJson(Path dir, int n) {
		String subPk = IOUtil.readString(dir.resolve("sub.pk"));

		StringBuilder onlineArr = new StringBuilder();
		onlineArr.append('[');
		for (int i = 0; i < n; i++) {
			if (i > 0) onlineArr.append(',');
			onlineArr.append('"').append(IOUtil.readString(dir.resolve("online_" + i + ".pk"))).append('"');
		}
		onlineArr.append(']');

		StringBuilder offlineArr = new StringBuilder();
		offlineArr.append('[');
		for (int i = 0; i < n; i++) {
			if (i > 0) offlineArr.append(',');
			offlineArr.append('"').append(IOUtil.readString(dir.resolve("offline_" + i + ".pk"))).append('"');
		}
		offlineArr.append(']');

		return "{\n" +
			"  \"version\": 1,\n" +
			"  \"n\": " + n + ",\n" +
			"  \"subPk\": \"" + subPk + "\",\n" +
			"  \"onlinePks\": " + onlineArr + ",\n" +
			"  \"offlinePks\": " + offlineArr + "\n" +
			"}\n";
	}

	private static String renderPublicKeyList(Path dir, int n) {
		StringBuilder sb = new StringBuilder();
		sb.append("# Ring Public Keys\n");
		sb.append("sub.pk=").append(IOUtil.readString(dir.resolve("sub.pk"))).append('\n');
		for (int i = 0; i < n; i++) {
			sb.append("online_").append(i).append(".pk=")
				.append(IOUtil.readString(dir.resolve("online_" + i + ".pk"))).append('\n');
			sb.append("offline_").append(i).append(".pk=")
				.append(IOUtil.readString(dir.resolve("offline_" + i + ".pk"))).append('\n');
		}
		// 仅展示成员拥有的私钥文件名（不输出私钥值）
		sb.append("members_private_materials=[");
		for (int i = 0; i < n; i++) {
			if (i > 0) sb.append(',');
			sb.append("online_").append(i).append(".sk & summed_").append(i).append(".sk");
		}
		sb.append("]\n");
		return sb.toString();
	}
}
