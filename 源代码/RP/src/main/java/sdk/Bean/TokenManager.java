package sdk.Bean;

public class TokenManager {
    static String token;
    static byte[] signature;

    static public String getToken() {
        return token;
    }

    static public void setToken(String token1) {
        token = token1;
    }

    static public byte[] getSignature() {
        return signature;
    }

    static public void setSignature(byte[] signature1) {
        signature = signature1;
    }
}
