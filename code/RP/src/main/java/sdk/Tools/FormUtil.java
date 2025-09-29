package sdk.Tools;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

public final class FormUtil {
    private FormUtil() {}

    // RFC3986 风格的百分号编码（URLEncoder基础上修正）
    public static String pctEncode(String s) {
        try {
            return URLEncoder.encode(s, StandardCharsets.UTF_8.name())
                    .replace("+", "%20")
                    .replace("*", "%2A")
                    .replace("%7E", "~");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /** 参与签名的规范化串（不含 client_assertion） */
    public static String canonicalForSigning(Map<String,String> params) {
        return params.entrySet().stream()
                .filter(e -> !"client_assertion".equals(e.getKey()))
                .sorted(Map.Entry.comparingByKey())
                .map(e -> pctEncode(e.getKey()) + "=" + pctEncode(e.getValue()))
                .collect(Collectors.joining("&"));
    }

    /** 作为请求体发送的最终 x-www-form-urlencoded（包含 client_assertion） */
    public static byte[] encodeBody(Map<String,String> params) {
        String s = params.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> pctEncode(e.getKey()) + "=" + pctEncode(e.getValue()))
                .collect(Collectors.joining("&"));
        return s.getBytes(StandardCharsets.UTF_8);
    }
}