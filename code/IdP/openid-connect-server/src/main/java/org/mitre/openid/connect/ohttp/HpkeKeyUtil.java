package org.mitre.openid.connect.ohttp;

import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.generators.X25519KeyPairGenerator;
import org.bouncycastle.crypto.params.X25519KeyGenerationParameters;
import org.bouncycastle.crypto.params.X25519PrivateKeyParameters;
import org.bouncycastle.crypto.params.X25519PublicKeyParameters;
import org.bouncycastle.util.io.pem.PemObject;
import org.bouncycastle.util.io.pem.PemWriter;

import java.io.FileWriter;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;

public class HpkeKeyUtil {

    /**
     * 生成 HPKE X25519 密钥对
     */
    public static AsymmetricCipherKeyPair generateHpkeKeyPair() {
        X25519KeyPairGenerator kpg = new X25519KeyPairGenerator();
        kpg.init(new X25519KeyGenerationParameters(new SecureRandom()));
        return kpg.generateKeyPair();
    }

    /**
     * 保存为 PEM 文件
     */
    public static void saveKeyPairToPem(AsymmetricCipherKeyPair kp, String pubPath, String privPath) throws IOException {
        X25519PublicKeyParameters pub = (X25519PublicKeyParameters) kp.getPublic();
        X25519PrivateKeyParameters pri = (X25519PrivateKeyParameters) kp.getPrivate();

        try (PemWriter pubWriter = new PemWriter(new FileWriter(pubPath));
             PemWriter privWriter = new PemWriter(new FileWriter(privPath))) {
            pubWriter.writeObject(new PemObject("X25519 PUBLIC KEY", pub.getEncoded()));
            privWriter.writeObject(new PemObject("X25519 PRIVATE KEY", pri.getEncoded()));
        }
    }

    /**
     * 保存为原始 Base64 编码的二进制（可选，简单方案）
     */
    public static void saveKeyPairToBase64(AsymmetricCipherKeyPair kp, String pubPath, String privPath) throws IOException {
        X25519PublicKeyParameters pub = (X25519PublicKeyParameters) kp.getPublic();
        X25519PrivateKeyParameters pri = (X25519PrivateKeyParameters) kp.getPrivate();

        try (FileWriter pubWriter = new FileWriter(pubPath);
             FileWriter privWriter = new FileWriter(privPath)) {
            pubWriter.write(Base64.getEncoder().encodeToString(pub.getEncoded()));
            privWriter.write(Base64.getEncoder().encodeToString(pri.getEncoded()));
        }
    }

    /**
     * 从 PEM 文件加载公私钥
     */
    public static AsymmetricCipherKeyPair loadKeyPairFromPem(String pubPath, String privPath) throws IOException {
        byte[] pub = PemFileUtil.readPem(pubPath);
        byte[] pri = PemFileUtil.readPem(privPath);
        X25519PublicKeyParameters pubKey = new X25519PublicKeyParameters(pub, 0);
        X25519PrivateKeyParameters priKey = new X25519PrivateKeyParameters(pri, 0);
        return new AsymmetricCipherKeyPair(pubKey, priKey);
    }
}
