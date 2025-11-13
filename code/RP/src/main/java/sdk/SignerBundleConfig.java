package sdk;

import com.google.gson.Gson;
import java.nio.file.Path;
import java.util.List;

public class SignerBundleConfig {
	public int version;
	public int index;
	public int n;
	public String subPk;
	public List<String> onlinePks;
	public List<String> offlinePks;

    public static SignerBundleConfig load(Path signerDir) {
        Path cfgPath = signerDir.resolve("client_config.json");
        String json = readAll(cfgPath);
        SignerBundleConfig cfg = new Gson().fromJson(json, SignerBundleConfig.class);

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
        return cfg;
    }

    private static String readAll(Path p) {
        try {
            byte[] data = java.nio.file.Files.readAllBytes(p);
            return new String(data, java.nio.charset.StandardCharsets.US_ASCII).trim();
        } catch (java.io.IOException e) {
            throw new IllegalStateException("读取失败: " + p + " : " + e.getMessage(), e);
        }
    }

    private static void require(boolean cond, String msg) {
        if (!cond) throw new IllegalStateException(msg);
    }

    /** 校验 33B 压缩公钥（66 hex，前缀 0x02/0x03） */
    private static void requireHex33(String hex, String name) {
        require(hex != null && hex.length() == 66, name + " 必须是 33 字节压缩公钥(66 hex)");
        int prefix = Integer.parseInt(hex.substring(0, 2), 16);
        require(prefix == 0x02 || prefix == 0x03, name + " 前缀必须是 0x02 或 0x03");
    }
}
