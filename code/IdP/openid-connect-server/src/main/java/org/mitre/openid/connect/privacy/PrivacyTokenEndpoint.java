package org.mitre.openid.connect.privacy;

import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Principal;
import java.util.Base64;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.common.exceptions.*;
import org.springframework.security.oauth2.provider.*;
import org.springframework.security.oauth2.provider.code.AuthorizationCodeServices;
import org.springframework.security.oauth2.provider.endpoint.PkceConstants;
import org.springframework.security.oauth2.provider.token.AuthorizationServerTokenServices;
import org.springframework.util.StringUtils;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/code4token")
public class PrivacyTokenEndpoint {

	private static final Logger logger = LoggerFactory.getLogger(PrivacyTokenEndpoint.class);

	private final AuthorizationCodeServices authorizationCodeServices;
	private final AuthorizationServerTokenServices tokenServices;

	@Autowired
	private AuthorizationServerTokenServices defaultOAuth2ProviderTokenService;

	@Autowired
	public PrivacyTokenEndpoint(AuthorizationCodeServices authorizationCodeServices,
								AuthorizationServerTokenServices tokenServices) {
		this.authorizationCodeServices = authorizationCodeServices;
		this.tokenServices = tokenServices;
	}

	@RequestMapping(method = RequestMethod.POST)
	public ResponseEntity<OAuth2AccessToken> postAccessToken(
		Principal principal,
		@RequestParam Map<String, String> parameters) throws HttpRequestMethodNotSupportedException {

		logger.info("[PrivacyTokenEndpoint] POST /oauth/token invoked");


		// 隐私模式：验证签名（留空实现）
		if (!verifyPrivacySignature(parameters, parameters.get("client_assertion"))) {
			throw new InvalidClientException("Invalid privacy signature");
		}
		logger.info("[PrivacyTokenEndpoint] privacy signature verified (stub)");



		// 校验授权码
		String code = parameters.get("code");
		if (!StringUtils.hasText(code)) {
			throw new InvalidRequestException("Missing authorization code");
		}

		OAuth2Authentication authWithPkce = authorizationCodeServices.consumeAuthorizationCode(code);
		if (authWithPkce == null) {
			throw new InvalidGrantException("Invalid or expired authorization code");
		}

		// 验证 PKCE
		Map<String, Serializable> ext = authWithPkce.getOAuth2Request().getExtensions();
		String challenge = (String) ext.get("code_challenge");
		String method    = (String) ext.get("code_challenge_method");

		String verifier = parameters.get("code_verifier");
		if (!StringUtils.hasText(verifier)) {
			throw new InvalidGrantException("PKCE: missing code_verifier");
		}

		if (!PkceConstants.ALLOWED_METHODS.contains(method)) {
			throw new InvalidGrantException(
				"PKCE: unsupported code_challenge_method '" + method +
					"', allowed: " + PkceConstants.ALLOWED_METHODS);
		}

		String calculated;
		try {
			calculated = Base64.getUrlEncoder().withoutPadding()
				.encodeToString(MessageDigest.getInstance("SHA-256")
					.digest(verifier.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 not available", e);
		}

		if (!calculated.equals(challenge)) {
			throw new InvalidGrantException("PKCE: code_verifier mismatch");
		}

		//去除 code_challenge 和 code_chalenge_method 扩展字段，否则无法生成 token
		OAuth2Request cleanRequest = new OAuth2Request(
			authWithPkce.getOAuth2Request().getRequestParameters(),
			authWithPkce.getOAuth2Request().getClientId(),
			authWithPkce.getOAuth2Request().getAuthorities(),
			true,   // approved
			authWithPkce.getOAuth2Request().getScope(),
			authWithPkce.getOAuth2Request().getResourceIds(),
			authWithPkce.getOAuth2Request().getRedirectUri(),
			null,   // responseTypes 为 null
			null    // extensions 留空
		);

		OAuth2Authentication auth = new OAuth2Authentication(cleanRequest, authWithPkce.getUserAuthentication());

		// 直接使用保存的 OAuth2Authentication 颁发 Token
		OAuth2AccessToken token = tokenServices.createAccessToken(auth);

		logger.info("[PrivacyTokenEndpoint] token generated = {}", token);
		return new ResponseEntity<>(token, HttpStatus.OK);
	}

	private boolean verifyPrivacySignature(Map<String, String> params,
										   String signature) {
		// TODO：接入环签名 / Privacy-Pass
		return true; // 目前直接放行
	}

}

