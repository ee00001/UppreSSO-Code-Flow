package org.mitre.openid.connect.ohttp;

import java.net.URLDecoder;
import java.nio.charset.Charset;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 解析 application/x-www-form-urlencoded
 */
public class UrlForm {
	public static Map<String,String> parse(byte[] data, Charset cs) throws Exception {
		String s = new String(data, cs);
		Map<String,String> map = new LinkedHashMap<>();
		for (String kv : s.split("&")) {
			if (kv.isEmpty()) continue;
			int idx = kv.indexOf('=');
			String k = idx >= 0 ? kv.substring(0, idx) : kv;
			String v = idx >= 0 ? kv.substring(idx + 1) : "";
			map.put(URLDecoder.decode(k, cs.name()), URLDecoder.decode(v, cs.name()));
		}
		return map;
	}
}
