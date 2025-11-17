package org.mitre.openid.connect;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class RingVerifierConfig {
	@Bean
	public RingVerifier ringVerifier() {
		String dir = System.getProperty("ring.key.dir",
			System.getenv().getOrDefault("RING_KEY_DIR", "ring_key"));
		Path ringKeyDir = Paths.get(dir);
		return RingVerifier.fromPublicJson(ringKeyDir);
	}
}
