package org.mitre.openid.connect.ohttp;

import java.nio.ByteBuffer;

public class OHttpHeaderKeyConfig {
    private final byte keyId;
    private final int kemId;
    private final int kdfId;
    private final int aeadId;

    public OHttpHeaderKeyConfig(byte keyId, int kemId, int kdfId, int aeadId) {
        this.keyId = keyId;
        this.kemId = kemId;
        this.kdfId = kdfId;
        this.aeadId = aeadId;
    }

    public static OHttpHeaderKeyConfig defaultConfig() {
        return new OHttpHeaderKeyConfig(
                (byte) 1, // keyId，可自定义标识这把公钥
                HpkeKem.DHKEM_X25519_HKDF_SHA256,
                HpkeKdf.HKDF_SHA256,
                HpkeAead.AES_128_GCM
        );
    }


    public byte getKeyId() { return keyId; }
    public int getKemId() { return kemId; }
    public int getKdfId() { return kdfId; }
    public int getAeadId() { return aeadId; }

    // === 校验算法 ID 合法性 ===
    public void validate() {
        if (!HpkeKem.isSupported(kemId))
            throw new IllegalArgumentException("Unsupported KEM ID: " + kemId);
        if (!HpkeKdf.isSupported(kdfId))
            throw new IllegalArgumentException("Unsupported KDF ID: " + kdfId);
        if (!HpkeAead.isSupported(aeadId))
            throw new IllegalArgumentException("Unsupported AEAD ID: " + aeadId);
    }

    // === 序列化 header (keyId + kemId + kdfId + aeadId) ===
    public byte[] serializePayloadHeader() {
        ByteBuffer buf = ByteBuffer.allocate(1 + 2 + 2 + 2);
        buf.put(keyId);
        buf.putShort((short) kemId);
        buf.putShort((short) kdfId);
        buf.putShort((short) aeadId);
        return buf.array();
    }

    // === 从字节数组解析 ===
    public static OHttpHeaderKeyConfig parsePayloadHeader(byte[] bytes) {
        ByteBuffer buf = ByteBuffer.wrap(bytes);
        byte keyId = buf.get();
        int kemId = Short.toUnsignedInt(buf.getShort());
        int kdfId = Short.toUnsignedInt(buf.getShort());
        int aeadId = Short.toUnsignedInt(buf.getShort());
        return new OHttpHeaderKeyConfig(keyId, kemId, kdfId, aeadId);
    }


    @Override
    public String toString() {
        return "[key_id=" + (keyId & 0xFF) +
                ", kem=" + HpkeKem.toString(kemId) +
                ", kdf=" + HpkeKdf.toString(kdfId) +
                ", aead=" + HpkeAead.toString(aeadId) + "]";
    }

    public int getEncLength() {
        switch (kemId) {
            case HpkeKem.DHKEM_X25519_HKDF_SHA256: return 32;
// 暂未提供支持
//            case HpkeKem.DHKEM_P256_HKDF_SHA256:   return 65;
//            case HpkeKem.DHKEM_P384_HKDF_SHA384:   return 97;
//            case HpkeKem.DHKEM_P521_HKDF_SHA512:   return 133;
            default: throw new IllegalArgumentException("Unknown KEM id: " + kemId);
        }
    }
}

