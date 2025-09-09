package org.springframework.security.oauth2.provider.endpoint;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.provider.AuthorizationRequest;
import org.springframework.security.oauth2.provider.ClientDetailsService;
import org.springframework.security.oauth2.provider.request.DefaultOAuth2RequestFactory;

import java.util.Map;

public class PkceAwareOAuth2RequestFactory extends DefaultOAuth2RequestFactory {
	private static final Logger logger = LoggerFactory.getLogger(PkceAwareOAuth2RequestFactory.class);

	public PkceAwareOAuth2RequestFactory(ClientDetailsService clientDetailsService) {
		super(clientDetailsService);
	}

	@Override
	public AuthorizationRequest createAuthorizationRequest(Map<String, String> params) {
		AuthorizationRequest req = super.createAuthorizationRequest(params);
		// 保存 PKCE 参数
		if (params.containsKey("code_challenge")) {
			logger.info("PKCE: save challenge={}, method={}",
				params.get("code_challenge"), params.get("code_challenge_method"));
			req.getExtensions().put("code_challenge", params.get("code_challenge"));
			req.getExtensions().put("code_challenge_method", params.get("code_challenge_method"));
		}

		return req;
	}
}
