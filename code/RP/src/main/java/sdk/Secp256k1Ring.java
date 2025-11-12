package sdk;

import java.io.File;

public final class Secp256k1Ring {
    private Secp256k1Ring() {}

    // ---- 状态 ----
    private static volatile boolean LIB_LOADED = false;
    private static volatile boolean NATIVES_RESOLVED = false;
    private static volatile String  LOAD_ERROR = null;


    static {
        try {
            System.loadLibrary("secp256k1zkp_jni");
            LIB_LOADED = true;          // 关键：标记已加载
            tryResolveNatives();         // 触发一次本地符号解析
        } catch (UnsatisfiedLinkError | SecurityException e) {
            LOAD_ERROR = e.toString();
            LIB_LOADED = false;
            NATIVES_RESOLVED = false;
        }
    }

    /** —— 仅检查 DLL 是否被成功加载 —— */
    public static boolean isLibraryLoaded() {
        return LIB_LOADED;
    }

    /** —— 进一步检查：native 符号是否可解析（已尝试触发一次） —— */
    public static boolean isNativeResolvable() {
        return NATIVES_RESOLVED;
    }

    /** —— 不就绪则抛异常（附诊断信息） —— */
    public static void requireLibraryLoaded() {
        if (!LIB_LOADED) {
            StringBuilder sb = new StringBuilder("Native library not loaded. ");
            if (LOAD_ERROR != null) sb.append("Load error: ").append(LOAD_ERROR).append(". ");
            sb.append(diagnose());
            throw new IllegalStateException(sb.toString());
        }
    }

    /** —— 打印诊断信息（工作目录 / java.library.path / PATH 片段） —— */
    public static String diagnose() {
        String cwd = new File(".").getAbsolutePath();
        String jlp = System.getProperty("java.library.path", "");
        String path = System.getenv("PATH");
        return String.format("cwd=%s; java.library.path=%s; PATH(head)=%s",
                cwd, jlp, path == null ? "" : head(path, 300));
    }

    private static String head(String s, int n) {
        if (s == null) return "";
        return s.length() <= n ? s : (s.substring(0, n) + "...");
    }

    /** —— Level 2：尝试解析 native 符号（不要求功能成功） —— */
    private static void tryResolveNatives() {
        // 仅在已 load 的前提下做
        if (!LIB_LOADED) return;
        try {
            // 构造最小占位参数：长度一致但内容无意义，仅用来触发符号解析
            byte[][] pk1 = new byte[][]{ new byte[33] }; // 1 个 33B 公钥
            byte[][] pk2 = new byte[][]{ new byte[33] };
            byte[] sub   = new byte[33];

            // 触发一次 verify 的 JNI 入口解析（不关心返回值）
            // 如果 JNI 未正确链接/找不到符号，会抛 UnsatisfiedLinkError
            whitelistVerify(new byte[1 + 32 + 32], pk1, pk2, sub);

            NATIVES_RESOLVED = true; // 入口已成功调用（并未代表功能正确）
        } catch (UnsatisfiedLinkError e) {
            NATIVES_RESOLVED = false; // 符号解析失败
        } catch (Throwable t) {
            // 其他异常（例如 JNI 内部参数检查抛的异常）也说明符号已解析
            NATIVES_RESOLVED = true;
        }
    }

    public static native byte[] whitelistSign(byte[][] onlinePk33,
                                              byte[][] offlinePk33,
                                              byte[]   subPk33,
                                              byte[]   onlineSk32,
                                              byte[]   summedSk32,
                                              int      index);

    public static native boolean whitelistVerify(byte[]   sig,
                                                 byte[][] onlinePk33,
                                                 byte[][] offlinePk33,
                                                 byte[]   subPk33);
    // 便捷封装（参数校验）
    public static byte[] sign(byte[][] onlinePk33, byte[][] offlinePk33,
                              byte[] subPk33, byte[] signerOnlineSk32,
                              byte[] summedSk32, int index) {
        if (onlinePk33 == null || offlinePk33 == null || subPk33 == null
                || signerOnlineSk32 == null || summedSk32 == null) {
            throw new IllegalArgumentException("null argument");
        }
        if (subPk33.length != 33) throw new IllegalArgumentException("subPk33 must be 33 bytes");
        if (signerOnlineSk32.length != 32) throw new IllegalArgumentException("onlineSk32 must be 32 bytes");
        if (summedSk32.length != 32) throw new IllegalArgumentException("summedSk32 must be 32 bytes");
        if (onlinePk33.length != offlinePk33.length || onlinePk33.length == 0) {
            throw new IllegalArgumentException("online/offline size mismatch or empty");
        }
        return whitelistSign(onlinePk33, offlinePk33, subPk33, signerOnlineSk32, summedSk32, index);
    }

    public static boolean verify(byte[] sig, byte[][] onlinePk33,
                                 byte[][] offlinePk33, byte[] subPk33) {
        if (sig == null || onlinePk33 == null || offlinePk33 == null || subPk33 == null) {
            throw new IllegalArgumentException("null argument");
        }
        if (subPk33.length != 33) throw new IllegalArgumentException("subPk33 must be 33 bytes");
        if (onlinePk33.length != offlinePk33.length || onlinePk33.length == 0) {
            throw new IllegalArgumentException("online/offline size mismatch or empty");
        }
        return whitelistVerify(sig, onlinePk33, offlinePk33, subPk33);
    }
}
