package org.mitre.openid.connect.ohttp;


import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.mitre.openid.connect.privacy.PrivacyTokenEndpoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


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
		OHttpRequest.Context serverCtx = ohttpReq.buildServerContext(serverKeyPair, "ohttp request");
		byte[] plainHttp = serverCtx.open(ohttpReq.getCiphertext());

		return null;
	}
}
