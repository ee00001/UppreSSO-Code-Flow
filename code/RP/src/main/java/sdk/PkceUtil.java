package sdk;

import java.security.SecureRandom;
import java.util.Base64;

public class PkceUtil {
    private static final SecureRandom SR = new SecureRandom();

    // 64 字节 / 86 字符
    public static String generateVerifier() {
        byte[] buf = new byte[64];
        SR.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    //SHA256 challenge
    public static String challenge(String verifier) {
        try {
            byte[] hash = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(verifier.getBytes("UTF-8"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private PkceUtil() {}
}
