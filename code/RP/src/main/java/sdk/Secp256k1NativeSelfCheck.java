package sdk;

public final class Secp256k1NativeSelfCheck {
    public static void main(String[] args) {
        System.out.println("=== secp256k1 JNI 自检 ===");
        System.out.println("Ring.class from: " +
                sdk.Secp256k1Ring.class.getProtectionDomain().getCodeSource().getLocation());
        System.out.println("Ring.method.signatures via javap expectation: [[B[[B[B[BI)[B and ([B[[B[[B[B)Z");
        System.out.println("cwd=" + new java.io.File(".").getAbsolutePath());
        System.out.println("java.library.path=" + System.getProperty("java.library.path", ""));
        System.out.println("PATH(head)=" + head(System.getenv("PATH"), 300));

        boolean loaded = Secp256k1Ring.isLibraryLoaded();
        boolean resolved = Secp256k1Ring.isNativeResolvable();

        System.out.println("DLL loaded? " + loaded);
        System.out.println("Native symbols resolvable? " + resolved);

        if (!loaded) {
            System.err.println("[诊断] " + Secp256k1Ring.diagnose());
            System.exit(1);
        }
        System.exit(0);
    }

    private static String head(String s, int n) {
        if (s == null) return "";
        return s.length() <= n ? s : (s.substring(0, n) + "...");
    }
}