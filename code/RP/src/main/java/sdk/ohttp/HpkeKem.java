package sdk.ohttp;

// === 支持的算法枚举 ===
public class HpkeKem {
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
