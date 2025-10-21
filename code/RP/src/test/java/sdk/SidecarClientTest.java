package sdk;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

// 需先拉起 sidecar 和 issuer，再进行测试
public class SidecarClientTest {
    private static final String DEFAULT_BASE = "http://127.0.0.1:9797";
    private static final String SIDECAR_BASE = System.getProperty(
            "sidecar.base",
            System.getenv("SIDECAR_BASE") != null ? System.getenv("SIDECAR_BASE") : DEFAULT_BASE
    );

    private static final String HEALTH_URL = SIDECAR_BASE + "/health";
    private static final int HTTP_TIMEOUT_MS = Integer.getInteger("test.httpTimeoutMs", 1500);

    private static final Gson GSON = new Gson();
    private static final Type MAP_TYPE = new TypeToken<Map<String, Object>>(){}.getType();

    // 用于严格校验 Authorization 头的格式
    private static final Pattern PRIV_TOKEN_PATTERN =
            Pattern.compile("^\\s*PrivateToken\\s+token=\"[A-Za-z0-9_\\-]+\"\\s*$");

    private static boolean healthOk;

    @BeforeAll
    static void checkHealthOrSkip() {
        healthOk = probeHealth();
        if (!healthOk) {
            System.err.println("[test] sidecar /health 不可达（或不是 200），后续测试将以假设跳过方式处理: " + HEALTH_URL);
        }
    }

    @Test
    @DisplayName("sidecar /health 可达（不可达则跳过后续严格断言）")
    void health_isReachable() {
        assumeTrue(healthOk, "sidecar 健康检查未通过，跳过");
    }

    @Test
    @DisplayName("软校验：尝试获取 Authorization 头，不抛异常；若返回非空则满足格式")
    void acquireHeader_soft() {
        // 不强制要求 sidecar 一定能产出 token（可能发行端没开/目录不可达）
        // 只要求方法不抛异常，若返回不为空则格式必须正确
        String header = null;
        Exception error = null;
        try {
            header = SidecarClient.acquirePrivateTokenHeader();
        } catch (Exception e) {
            error = e;
        }
        assertNull(error, "acquirePrivateTokenHeader 不应抛出异常，但收到了: " + error);

        if (header == null || header.trim().isEmpty()) {
            System.out.println("[test] 未拿到 token（可能库存为 0 或发行端未联通），不作为失败。");
        } else {
            assertTrue(PRIV_TOKEN_PATTERN.matcher(header).matches(),
                    "返回的 Authorization 头格式不正确: " + header);
        }
    }

    @Test
    @DisplayName("硬校验（可选）：当 -Dpp.requireToken=true 时，必须拿到 token，且格式正确")
    void acquireHeader_hard() {
        boolean require = Boolean.parseBoolean(System.getProperty("pp.requireToken", "false"));
        assumeTrue(require, "未开启硬校验（-Dpp.requireToken=true），跳过");

        assumeTrue(healthOk, "sidecar 健康检查未通过，跳过硬校验");

        String header = SidecarClient.acquirePrivateTokenHeader();
        assertNotNull(header, "要求必须拿到 token，但拿到 null（请确保 sidecar 可预取/目录与发行端联通）");
        assertTrue(PRIV_TOKEN_PATTERN.matcher(header).matches(),
                "返回的 Authorization 头格式不正确: " + header);
    }


    /* ================= 工具函数 ================= */

    private static boolean probeHealth() {
        try {
            HttpURLConnection c = (HttpURLConnection) new URL(HEALTH_URL).openConnection();
            c.setConnectTimeout(HTTP_TIMEOUT_MS);
            c.setReadTimeout(HTTP_TIMEOUT_MS);
            c.setRequestMethod("GET");
            int code = c.getResponseCode();
            if (code != 200) return false;

            byte[] body = readAll(c.getInputStream());
            if (body == null) return true; // 只看 200 也行
            Map<String, Object> m = GSON.fromJson(
                    new String(body, StandardCharsets.UTF_8), MAP_TYPE);
            Object ok = m.get("ok");
            return (ok instanceof Boolean) && ((Boolean) ok);
        } catch (Exception e) {
            return false;
        }
    }

    private static byte[] readAll(InputStream is) {
        if (is == null) return null;
        try (InputStream in = is; ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[4096];
            int len;
            while ((len = in.read(buf)) != -1) bos.write(buf, 0, len);
            return bos.toByteArray();
        } catch (Exception e) {
            return null;
        }
    }
}
