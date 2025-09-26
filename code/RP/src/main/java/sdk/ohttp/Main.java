package sdk.ohttp;

import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.params.X25519PublicKeyParameters;

public class Main {
    public static void main(String[] args) throws Exception {
        // 1️⃣ 生成密钥对
        AsymmetricCipherKeyPair kp = HpkeKeyUtil.generateHpkeKeyPair();

        // 2️⃣ 保存 PEM 文件
        HpkeKeyUtil.saveKeyPairToPem(kp, "ohttp_pub.pem", "ohttp_priv.pem");
        System.out.println("HPKE 公钥已保存到 ohttp_pub.pem");
        System.out.println("HPKE 私钥已保存到 ohttp_priv.pem");

        // 3️⃣ 测试加载
        AsymmetricCipherKeyPair loaded = HpkeKeyUtil.loadKeyPairFromPem("ohttp_pub.pem", "ohttp_priv.pem");
        System.out.println("加载完成，公钥长度: " + ((X25519PublicKeyParameters)loaded.getPublic()).getEncoded().length);
    }
}
