package sdk;

//TODO:环签名和privacy Pass
public class AnonymousSignatureModule {
    public static String sign(String payload) {
        return payload;
    }

    public static boolean verify(String payload, String signature) {
        return true;
    }
}
