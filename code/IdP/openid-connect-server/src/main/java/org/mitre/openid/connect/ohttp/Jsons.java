package org.mitre.openid.connect.ohttp;

import com.fasterxml.jackson.databind.ObjectMapper;

public class Jsons {
	private static final ObjectMapper MAPPER = new ObjectMapper();

	public static byte[] writeBytes(Object o) throws Exception {
		return MAPPER.writeValueAsBytes(o);
	}
}
