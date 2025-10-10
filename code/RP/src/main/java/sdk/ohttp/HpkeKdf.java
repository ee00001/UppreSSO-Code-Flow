package sdk.ohttp;

public class HpkeKdf {
    public static final int HKDF_SHA256 = 0x0001;
    public static boolean isSupported(int id) { return id == HKDF_SHA256; }
    public static String toString(int id) {
        return id == HKDF_SHA256 ? "HKDF-SHA256" : "Unknown(" + id + ")";
    }
}
