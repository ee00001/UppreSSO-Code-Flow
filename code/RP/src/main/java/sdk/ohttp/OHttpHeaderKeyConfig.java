package sdk.ohttp;

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
}

// === 支持的算法枚举 ===
class HpkeKem {
    public static final int DHKEM_X25519_HKDF_SHA256 = 0x0020; // 32
    public static boolean isSupported(int kemId) {
        return kemId == DHKEM_X25519_HKDF_SHA256;
    }
    public static String toString(int kemId) {
        switch (kemId) {
            case DHKEM_X25519_HKDF_SHA256: return "X25519-SHA256";
            default: return "Unknown(" + kemId + ")";
        }
    }
}

class HpkeKdf {
    public static final int HKDF_SHA256 = 0x0001;
    public static boolean isSupported(int id) { return id == HKDF_SHA256; }
    public static String toString(int id) {
        return id == HKDF_SHA256 ? "HKDF-SHA256" : "Unknown(" + id + ")";
    }
}

class HpkeAead {
    public static final int AES_128_GCM = 0x0001;
    public static final int AES_256_GCM = 0x0002;
    public static final int CHACHA20_POLY1305 = 0x0003;
    public static boolean isSupported(int id) {
        return id == AES_128_GCM || id == AES_256_GCM || id == CHACHA20_POLY1305;
    }
    public static String toString(int id) {
        switch (id) {
            case AES_128_GCM: return "AES-128-GCM";
            case AES_256_GCM: return "AES-256-GCM";
            case CHACHA20_POLY1305: return "CHACHA20-POLY1305";
            default: return "Unknown(" + id + ")";
        }
    }
}