package sdk.ohttp;

public class HpkeAead {
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
