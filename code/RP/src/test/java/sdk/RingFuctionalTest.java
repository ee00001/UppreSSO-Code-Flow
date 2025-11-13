package sdk;
// 环签名功能验证

import com.google.gson.Gson;

import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.security.SecureRandom;

import org.bouncycastle.util.Arrays;
import sdk.Tools.*;

public final class RingFuctionalTest {
	private static final Path RING_BASE = Paths.get("ring_key");

	public static void main(String[] args) {
		List<Path> clients = listClientDirs(RING_BASE);
		if (clients.isEmpty()) throw new IllegalStateException("未找到 client_* 目录: " + RING_BASE);

        SecureRandom rnd = new SecureRandom(new byte[]{1,2,3,4,5,6,7,8});

        int passNoMsg = 0;
        int passWithMsg = 0;
		for (Path clientDir : clients) {
			System.out.println("\n=== [Client] " + clientDir.getFileName() + " ===");

			Path cfgPath = clientDir.resolve("client_config.json");
			String json = IOUtil.readString(cfgPath);
			SignerBundleConfig cfg = new Gson().fromJson(json, SignerBundleConfig.class);

			// 2) 基本校验
			require(cfg != null, "配置为空: " + cfgPath);
			require(cfg.n > 0, "n 必须 > 0");
			require(cfg.onlinePks != null && cfg.offlinePks != null, "onlinePks/offlinePks 不能为空");
			require(cfg.onlinePks.size() == cfg.n && cfg.offlinePks.size() == cfg.n,
				"online/offline 数量与 n 不一致");
			require(cfg.index >= 0 && cfg.index < cfg.n, "index 越界: " + cfg.index);
			requireHex33(cfg.subPk, "subPk");
			for (int i = 0; i < cfg.n; i++) {
				requireHex33(cfg.onlinePks.get(i),  "onlinePks[" + i + "]");
				requireHex33(cfg.offlinePks.get(i), "offlinePks[" + i + "]");
			}

			int i = cfg.index;
			byte[] onlineSk32 = Hex.fromHex(IOUtil.readString(clientDir.resolve("online_" + i + ".sk")));
			byte[] summedSk32 = Hex.fromHex(IOUtil.readString(clientDir.resolve("summed_" + i + ".sk")));
			requireLen(onlineSk32, 32, "online_" + i + ".sk");
			requireLen(summedSk32, 32, "summed_" + i + ".sk");

            byte[] subPk33      = Hex.fromHex(cfg.subPk);
            byte[][] onlinePks  = toPkArray(cfg.onlinePks);
            byte[][] offlinePks = toPkArray(cfg.offlinePks);

            byte[] sigLegacy = Secp256k1Ring.sign(onlinePks, offlinePks, subPk33, onlineSk32, summedSk32, i);
            System.out.println("[LEGACY] 生成签名 len=" + sigLegacy.length + " (index=" + i + ")");
            boolean okLegacy = Secp256k1Ring.verify(sigLegacy, onlinePks, offlinePks, subPk33);
            System.out.println("[LEGACY] 正确验证: " + okLegacy);
            if (!okLegacy) throw new AssertionError("正确签名未通过验证(legacy): " + clientDir);

            byte[] badSig = Arrays.copyOf(sigLegacy, sigLegacy.length);
            badSig[badSig.length - 1] ^= 1;
            boolean bad1 = Secp256k1Ring.verify(badSig, onlinePks, offlinePks, subPk33);
            System.out.println("[OK]  篡改签名验证(期望 false): " + bad1);
            if (bad1) throw new AssertionError("篡改签名仍通过验证: " + clientDir);

            passNoMsg++;

            List<byte[]> msgs = new ArrayList<>();
            msgs.add(new byte[0]); // 空
            msgs.add("abc".getBytes(StandardCharsets.UTF_8));      // ASCII
            msgs.add("心智/思维".getBytes(StandardCharsets.UTF_8));           // UTF-8 非 ASCII
            msgs.add(randomBytes(rnd, 510));                                // 长随机

            int okCount = 0;
            for (int k = 0; k < msgs.size(); k++) {
                byte[] msg = msgs.get(k);
                byte[] sigMsg = Secp256k1Ring.signWithMsg(onlinePks, offlinePks, subPk33, onlineSk32, summedSk32, i, msg);
                System.out.printf("[MSG-%d] 生成签名 len=%d, msgLen=%d%n", k, sigMsg.length, msg.length);

                // 正确消息验证：true
                boolean ok = Secp256k1Ring.verifyWithMsg(sigMsg, onlinePks, offlinePks, subPk33, msg);
                System.out.printf("[MSG-%d] 正确消息验证: %s%n", k, ok);
                if (!ok) throw new AssertionError("正确消息验证失败 with-msg (k=" + k + "): " + clientDir);

                // 错误消息验证：false （改一字节或拼接额外字节）
                byte[] wrong = Arrays.copyOf(msg, msg.length);
                wrong = (wrong.length == 0) ? new byte[]{1} : wrong;
                wrong[wrong.length - 1] ^= 1;
                boolean okWrong = Secp256k1Ring.verifyWithMsg(sigMsg, onlinePks, offlinePks, subPk33, wrong);
                System.out.printf("[MSG-%d] 错误消息验证(期望 false): %s%n", k, okWrong);
                if (okWrong) throw new AssertionError("错误消息仍然通过验证 with-msg (k=" + k + ")");

                // 篡改签名：false
                byte[] tampered = Arrays.copyOf(sigMsg, sigMsg.length);
                tampered[tampered.length - 1] ^= 1;
                boolean okTampered = Secp256k1Ring.verifyWithMsg(tampered, onlinePks, offlinePks, subPk33, msg);
                System.out.printf("[MSG-%d] 篡改签名验证(期望 false): %s%n", k, okTampered);
                if (okTampered) throw new AssertionError("篡改 with-msg 签名仍通过验证 (k=" + k + ")");

                // 交叉验证：with-msg 生成的签名，拿无消息 verify，应为 false
                boolean cross1 = Secp256k1Ring.verify(sigMsg, onlinePks, offlinePks, subPk33);
                System.out.printf("[MSG-%d] 交叉验证(sigMsg 用 legacy verify) 期望 false: %s%n", k, cross1);
                if (cross1) throw new AssertionError("with-msg 签名被 legacy verify 通过 (k=" + k + ")");

                // 交叉验证：legacy 签名，拿 with-msg verify（任意 msg），应为 false
                boolean cross2 = Secp256k1Ring.verifyWithMsg(sigLegacy, onlinePks, offlinePks, subPk33, msg);
                System.out.printf("[MSG-%d] 交叉验证(sigLegacy 用 verifyWithMsg) 期望 false: %s%n", k, cross2);
                if (cross2) throw new AssertionError("legacy 签名被 with-msg verify 通过 (k=" + k + ")");

                okCount++;
            }
            System.out.println("[WITH-MSG] 本客户端消息用例通过数: " + okCount + "/" + msgs.size());
            if (okCount == msgs.size()) passWithMsg++;

        }
        System.out.println("\n=== 完成 ===");
        System.out.println("Legacy  无消息签名通过的客户端数: " + passNoMsg   + "/" + clients.size());
        System.out.println("WithMsg 携带消息签名通过的客户端数: " + passWithMsg + "/" + clients.size());
	}


	private static List<Path> listClientDirs(Path base) {
		List<Path> out = new ArrayList<>();
		try (DirectoryStream<Path> ds = Files.newDirectoryStream(base, "client_*")) {
			for (Path p : ds) if (Files.isDirectory(p)) out.add(p);
		} catch (Exception ignore) {}
		out.sort(Comparator.comparing(Path::toString));
		return out;
	}

	private static void require(boolean cond, String msg) {
		if (!cond) throw new IllegalStateException(msg);
	}

	private static void requireHex33(String hex, String name) {
		require(hex != null && hex.length() == 66, name + " 必须是 33 字节压缩公钥(66 hex)");
		byte prefix = (byte) Integer.parseInt(hex.substring(0, 2), 16);
		require(prefix == 0x02 || prefix == 0x03, name + " 前缀必须是 0x02 或 0x03");
	}

	private static void requireLen(byte[] b, int len, String name) {
		require(b != null && b.length == len, name + " 长度必须是 " + len + " 字节");
	}

    private static byte[][] toPkArray(List<String> hexList) {
        byte[][] arr = new byte[hexList.size()][];
        for (int i = 0; i < hexList.size(); i++) arr[i] = Hex.fromHex(hexList.get(i));
        return arr;
    }

    private static byte[] randomBytes(SecureRandom rnd, int n) {
        byte[] b = new byte[n];
        rnd.nextBytes(b);
        return b;
    }

}
