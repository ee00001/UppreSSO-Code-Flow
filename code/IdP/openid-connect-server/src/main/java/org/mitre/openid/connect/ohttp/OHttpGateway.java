package org.mitre.openid.connect.ohttp;

import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.mitre.openid.connect.bhttp.BinaryHttpMessage;
import org.mitre.openid.connect.bhttp.BinaryHttpRequest;
import org.mitre.openid.connect.bhttp.BinaryHttpResponse;
import org.mitre.openid.connect.privacy.PrivacyTokenEndpoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.common.exceptions.InvalidClientException;
import org.springframework.security.oauth2.common.exceptions.InvalidGrantException;
import org.springframework.security.oauth2.common.exceptions.InvalidRequestException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Map;


@RestController
@RequestMapping("/gateway")
public class OHttpGateway {

	private final AsymmetricCipherKeyPair serverKeyPair;  // 服务器HPKE密钥
	private final OHttpHeaderKeyConfig keyConfig;         // OHTTP配置
	private final PrivacyTokenEndpoint privacyTokenEndpoint;


	@Autowired
	public OHttpGateway(PrivacyTokenEndpoint privacyTokenEndpoint) throws Exception {
		this.privacyTokenEndpoint = privacyTokenEndpoint;
		// 加载服务器长期 HPKE 私钥

		this.serverKeyPair = HpkeKeyUtil.loadKeyPairFromPem("./ohttp_pub.pem","./ohttp_priv.pem");
		this.keyConfig = OHttpHeaderKeyConfig.defaultConfig();
	}

	@PostMapping(consumes = "message/ohttp-req", produces = "message/ohttp-res")
	public ResponseEntity<byte[]> handleOhttpRequest(@RequestBody byte[] wire) throws Exception {
		// 解密 OHTTP 请求
		OHttpRequest ohttpReq = OHttpRequest.parseWire(wire);
		OHttpRequest.Context serverCtx = ohttpReq.buildServerContext(serverKeyPair);

		byte[] bhttpReqBytes;
		try {
			bhttpReqBytes = serverCtx.open(ohttpReq.getCiphertext());
		} catch (Exception e) {
			return ohttpError(serverCtx, 400, "invalid ohttp request");
		}

		// 解析 Binary HTTP 请求
		BinaryHttpRequest breq;
		try {
			breq = BinaryHttpRequest.deserialize(bhttpReqBytes);
		} catch (Exception e) {
			return ohttpError(serverCtx, 400, "malformed bhttp request");
		}

		if (!"POST".equalsIgnoreCase(breq.getMethod())) {
			return ohttpError(serverCtx, 405, "method not allowed");
		}

		// 查找 content-type
		String ctype = breq.getHeaderFields().stream()
			.filter(f -> f.name.equalsIgnoreCase("content-type"))
			.map(f -> f.value)
			.findFirst().orElse(null);
		if (ctype == null || !ctype.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
			return ohttpError(serverCtx, 415, "unsupported media type");
		}

		// 提取 Authorization
		String authorization = breq.getHeaderFields().stream()
			.filter(f -> f.name.equalsIgnoreCase("authorization"))
			.map(f -> f.value)
			.findFirst()
			.orElse(null);

		// 解析 body 为参数 Map
		Map<String, String> params;
		try {
			params = UrlForm.parse(breq.getBody(), StandardCharsets.UTF_8);
		} catch (Exception e) {
			return ohttpError(serverCtx, 400, "invalid form body");
		}

		// 调用实际的 token 端点
		ResponseEntity<OAuth2AccessToken> issued;
		try {
			issued = privacyTokenEndpoint.postAccessToken(null, params, authorization);
		} catch (InvalidClientException |
				 InvalidGrantException |
				 InvalidRequestException e) {
			return ohttpError(serverCtx, 400, e.getMessage());
		} catch (Exception e) {
			return ohttpError(serverCtx, 500, "internal error");
		}

		// 5) 封装 Binary HTTP 响应
		BinaryHttpResponse bresp = new BinaryHttpResponse()
			.setStatusCode(issued.getStatusCodeValue());
		bresp.addHeaderField(new BinaryHttpMessage.Field("content-type","application/json;charset=utf-8"));
		bresp.addHeaderField(new BinaryHttpMessage.Field("cache-control","no-store"));
		bresp.addHeaderField(new BinaryHttpMessage.Field("pragma","no-cache"));
		bresp.setBody(Jsons.writeBytes(issued.getBody()));  // 把token序列化为JSON

		byte[] bhttpResp = bresp.serialize();
		SecureRandom rnd;
		try {
			rnd = SecureRandom.getInstanceStrong();
		} catch (Exception ignore) {
			rnd = new SecureRandom();
		}
		byte[] wireResp = OHttpResponse.createServerOHttpResponse(bhttpResp, serverCtx, keyConfig, rnd).serialize();

		return ResponseEntity
			.ok()
			.header("Content-Type", "message/ohttp-res")
			.body(wireResp);
	}

	private ResponseEntity<byte[]> ohttpError(OHttpRequest.Context ctx, int status, String msg) {
		try {
			BinaryHttpResponse err = new BinaryHttpResponse()
				.setStatusCode(status)
				.setReasonPhrase(msg)
				.addHeaderField(new BinaryHttpMessage.Field("content-type", "application/json;charset=utf-8"));
			err.setBody(("{\"error\":\"" + msg + "\"}").getBytes(StandardCharsets.UTF_8));
			byte[] b = err.serialize();
			SecureRandom rnd;
			try { rnd = java.security.SecureRandom.getInstanceStrong(); } catch (Exception ignore) { rnd = new java.security.SecureRandom(); }
			byte[] wire = OHttpResponse.createServerOHttpResponse(b, ctx, keyConfig, rnd).serialize();
			return ResponseEntity.ok()
				.header("Content-Type", "message/ohttp-res")
				.body(wire);
		} catch (Exception e) {
			// 最坏情况直接500
			return ResponseEntity.status(500).build();
		}
	}
}
