package sdk;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

final class SidecarClient {

    private static final String DEFAULT_BASE = "http://127.0.0.1:9797";
    private static final String BASE = System.getProperty(
            "sidecar.base",
            System.getenv("SIDECAR_BASE") != null ? System.getenv("SIDECAR_BASE") : DEFAULT_BASE
    );

    private static final int PREFETCH = Integer.getInteger("sidecar.prefetch", 20);
    private static final int TIMEOUT_MS = Integer.getInteger("sidecar.timeoutMs", 1500);
    private static final Gson GSON = new Gson();
    private static final Type MAP_TYPE = new TypeToken<Map<String, Object>>(){}.getType();

    private SidecarClient() {}

    static String acquirePrivateTokenHeader() {
        try {
            String h = takeOne();
            if (h != null) return h;

            prefetch(PREFETCH);
            return takeOne();
        } catch (Exception e) {
            System.err.println("[sidecar] acquire token failed: " + e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private static String takeOne() throws IOException {
        String url = BASE + "/take?count=1";
        String resp = httpPostNoBody(url);
        if (resp == null) return null;

        Map<String, Object> map = GSON.fromJson(resp, MAP_TYPE);
        Object ok = map.get("ok");
        if (!(ok instanceof Boolean) || !((Boolean) ok)) return null;

        Object itemsObj = map.get("items");
        if (!(itemsObj instanceof List)) return null;
        List<?> items = (List<?>) itemsObj;
        if (items.isEmpty()) return null;

        Object first = items.get(0);
        if (!(first instanceof Map)) return null;
        Object header = ((Map<String, Object>) first).get("header");
        if (!(header instanceof String)) return null;

        return (String) header; // 例如：PrivateToken token="base64url..."
    }

    private static void prefetch(int n) throws IOException {
        String url = BASE + "/prefetch?count=" + n;
        // 忽略返回值，失败也不阻断
        httpPostNoBody(url);
    }

    private static String httpPostNoBody(String urlStr) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setConnectTimeout(TIMEOUT_MS);
        conn.setReadTimeout(TIMEOUT_MS);
        conn.setRequestMethod("POST");
        conn.setDoOutput(false);
        conn.setRequestProperty("Accept", "application/json");

        int code = -1;
        try {
            code = conn.getResponseCode();
            InputStream is = (code >= 200 && code < 300) ? conn.getInputStream() : conn.getErrorStream();
            if (is == null) return null;
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int len;
            while ((len = is.read(buf)) != -1) bos.write(buf, 0, len);
            return new String(bos.toByteArray(), StandardCharsets.UTF_8);
        } finally {
            try { conn.disconnect(); } catch (Exception ignore) {}
        }
    }
}
