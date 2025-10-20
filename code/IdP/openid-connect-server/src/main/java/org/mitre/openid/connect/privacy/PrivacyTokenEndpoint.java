package org.mitre.openid.connect.privacy;

import java.io.*;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Principal;
import java.net.URL;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.mitre.openid.connect.util.FormUtil;
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
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;


@RestController
@RequestMapping("/code4token")
public class PrivacyTokenEndpoint {

	private static final Logger logger = LoggerFactory.getLogger(PrivacyTokenEndpoint.class);

	private final AuthorizationCodeServices authorizationCodeServices;
	private final AuthorizationServerTokenServices tokenServices;

	@Autowired
	private AuthorizationServerTokenServices defaultOAuth2ProviderTokenService;

	// 默认本机 sidecar:9797
	private final String verifyUrl = System.getenv().getOrDefault(
		"PP_VERIFY_URL", "http://127.0.0.1:9797/verify");

	@Autowired
	public PrivacyTokenEndpoint(AuthorizationCodeServices authorizationCodeServices,
								AuthorizationServerTokenServices tokenServices) {
		this.authorizationCodeServices = authorizationCodeServices;
		this.tokenServices = tokenServices;
	}

	@RequestMapping(method = RequestMethod.POST)
	public ResponseEntity<OAuth2AccessToken> postAccessToken(
		Principal principal,
		@RequestParam Map<String, String> parameters,
		@RequestHeader(value = "Authorization", required = false) String authorization
	) throws HttpRequestMethodNotSupportedException {

		logger.info("[PrivacyTokenEndpoint] POST /oauth/token invoked");

//		verifyPrivateTokenWithSidecar(authorization);

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

	private void verifyPrivateTokenWithSidecar(String authorization) {
		if (authorization == null || !authorization.regionMatches(true, 0, "PrivateToken ", 0, "PrivateToken ".length())) {
			throw new InvalidClientException("Missing PrivateToken");
		}
		HttpURLConnection conn = null;
		try {
			URL url = new URL(verifyUrl);
			conn = (HttpURLConnection) url.openConnection();
			conn.setConnectTimeout(1500);
			conn.setReadTimeout(2000);
			conn.setRequestMethod("POST");
			conn.setDoOutput(true);
			conn.setRequestProperty("Authorization", authorization);
			// 不发送 body，告知 Content-Length: 0
			conn.setFixedLengthStreamingMode(0);
			conn.connect();

			int status = conn.getResponseCode();
			if (status == 200) {
				return; // OK
			} else if (status == 409) {
				String detail = readBodySilently(conn);
				throw new InvalidGrantException("PrivateToken replayed" + (detail.isEmpty() ? "" : ": " + detail));
			} else if (status == 401) {
				String detail = readBodySilently(conn);
				throw new InvalidClientException("Invalid PrivateToken" + (detail.isEmpty() ? "" : ": " + detail));
			} else {
				String detail = readBodySilently(conn);
				throw new InvalidClientException("PrivateToken verify failed: HTTP " + status +
					(detail.isEmpty() ? "" : " - " + detail));
			}
		} catch (InvalidClientException | InvalidGrantException e) {
			throw e;
		} catch (Exception e) {
			logger.warn("PrivateToken verifier error", e);
			throw new InvalidClientException("PrivateToken verifier error: " + e.getMessage());
		} finally {
			if (conn != null) conn.disconnect();
		}
	}

	private String readBodySilently(HttpURLConnection conn) {
		try (InputStream is = (conn.getErrorStream() != null) ? conn.getErrorStream() : conn.getInputStream();
			 BufferedReader br = (is == null) ? null : new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
			if (br == null) return "";
			return br.lines().collect(Collectors.joining("\n"));
		} catch (IOException ignore) {
			return "";
		}
	}

	private boolean verifyPrivacySignature(Map<String, String> params,
										   String signature) {
		// TODO：接入环签名 / Privacy-Pass
		// 拷贝一份，去掉 client_assertion 再规范化
		Map<String,String> copy = new HashMap<>(params);
		copy.remove("client_assertion");
		String canonical = FormUtil.canonicalForSigning(copy);

		return true; // 目前直接放行
	}

}

