package org.mitre.oauth2;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.provider.TokenGranter;
import org.springframework.security.oauth2.provider.CompositeTokenGranter;

import java.util.List;

@Configuration
public class CompositeTokenGranterConfig {
	
	@Autowired(required = false)
	private List<TokenGranter> granters;

	@Bean
	public TokenGranter tokenGranter() {
		return new CompositeTokenGranter(granters);
	}
}
