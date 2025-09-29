package org.mitre.openid.connect.ohttp;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
public class OHttpKeyConfigController {

	private final byte[] keyConfigBytes;

	public OHttpKeyConfigController() throws Exception {
		// 这里用你在 Gateway 中一样的 keyConfig，确保公钥和 KEM/KDF/AEAD 参数一致
		OHttpHeaderKeyConfig cfg = OHttpHeaderKeyConfig.defaultConfig();

		byte[] pubKey = HpkeKeyUtil.loadPublicKeyBytes("./ohttp_pub.pem");

		this.keyConfigBytes = cfg.encode(pubKey);
	}

	@GetMapping(value = "/.well-known/ohttp-gateway-key", produces = "application/ohttp-keys")
	public ResponseEntity<byte[]> getKeyConfig() {
		// 返回完整的 KeyConfig
		return ResponseEntity.ok(keyConfigBytes);
	}

}
