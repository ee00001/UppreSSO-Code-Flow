package org.springframework.security.oauth2.provider.endpoint;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

// 支持的 PKCE method
public final class PkceConstants {
	private PkceConstants() {}     // 防止实例化

	public static final Set<String> ALLOWED_METHODS;

	static {
		Set<String> set = new HashSet<>();
		set.add("S256");

		ALLOWED_METHODS = Collections.unmodifiableSet(set);
	}
}
