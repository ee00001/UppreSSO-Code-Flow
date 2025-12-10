package sdk;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import sdk.Tools.*;

public final class AnonymousSignatureModule {
    private AnonymousSignatureModule() {}

    private static final Logger logger = LoggerFactory.getLogger("sig");

    public static AnonSigResult buildAssertionOrPptoken(String payloadUtf8, String mode) {
        byte[] msg = payloadUtf8.getBytes(StandardCharsets.UTF_8);

        final String resolvedMode = (mode == null || mode.trim().isEmpty())
                ? "auto"
                : mode.trim().toLowerCase(Locale.ROOT);

        switch (resolvedMode) {
            case "pptoken": {
                // 强制使用 pptoken，不做 ring 尝试
                String authz = SidecarClient.acquirePrivateTokenHeader();
                return new AnonSigResult("pptoken", "", authz);
            }

            case "ring": {
                // 强制使用 ring，失败则抛错（不回落）
                return doRingOrThrow(msg,  false);
            }

            case "auto": {
                // 先尝试 ring，失败则回落到 pptoken
                try {
                    return doRingOrThrow(msg,  true); // 会在内部成功返回
                } catch (Throwable ringErr) {
                    // 只有当 allowFallback=false 才会抛出；这里传 true，正常不会到此
                    logger.error(
                            "[sig][auto] unexpected ring throw: type={}, msg={}",
                            ringErr.getClass().getName(),
                            ringErr.getMessage()
                    );
                }
                // 回落 pptoken
                String authz = SidecarClient.acquirePrivateTokenHeader();
                return new AnonSigResult("pptoken",  "", authz);
            }

            default:
                throw new IllegalArgumentException("Unsupported mode: " + mode + " (expected ring|pptoken|auto)");
        }
    }

    private static AnonSigResult doRingOrThrow(byte[] msg, boolean allowFallback) {
        Path signerDir = chooseSignerDir();
        if (signerDir == null) {
            String m = "[sig] signerDir is null; ring mode cannot proceed.";
            if (allowFallback) {
                logger.warn("{} fallback to pptoken.", m);
                String authz = SidecarClient.acquirePrivateTokenHeader();
                return new AnonSigResult("pptoken", "", authz);
            }
            throw new IllegalStateException(m);
        }

        try {
            // 载入 client_config.json（仅用于公钥）
            SignerBundleConfig cfg = SignerBundleConfig.load(signerDir);

            // 私钥本地读取
            RingKeyStore ks = new RingKeyStore(signerDir, cfg.n);

            // 公钥来自 cfg，不再读 *.pk
            byte[][] onlinePks  = toPkArray(cfg.onlinePks);
            byte[][] offlinePks = toPkArray(cfg.offlinePks);
            byte[]   subPk33    = Hex.fromHex(cfg.subPk);

            // 仅需本 client 的两把私钥
            byte[] onlineSk32 = ks.loadOnlineSk32(cfg.index);
            byte[] summedSk32 = ks.loadSummedSk32(cfg.index);

            Secp256k1Ring.requireLibraryLoaded();
            byte[] sig = Secp256k1Ring.whitelistSignMsg(
                    onlinePks, offlinePks, subPk33,
                    onlineSk32, summedSk32, cfg.index,
                    msg
            );

            logger.info(
                    "[sig] mode=ring index={} n={} sig.len={}",
                    cfg.index, cfg.n, sig.length
            );

            return new AnonSigResult("ring", b64url(sig), /*authz*/ null);

        } catch (Throwable ringErr) {

            logger.warn(
                    "[sig] ring-sign failed. type={} msg={}",
                    ringErr.getClass().getName(),
                    ringErr.getMessage()
            );

            if (allowFallback) {
                logger.warn("[sig] fallback to pptoken after ring failure.");
                String authz = SidecarClient.acquirePrivateTokenHeader();
                return new AnonSigResult("pptoken", "", authz);
            }
            // 强制 ring 模式：失败即抛
            throw (ringErr instanceof RuntimeException)
                    ? (RuntimeException) ringErr
                    : new RuntimeException(ringErr);
        }
    }


    private static Path chooseSignerDir() {
        Path base = Paths.get("ring_key");
        for (int i = 0; i <= 4; i++) {
            Path dir = base.resolve("client_" + i);
            if (Files.isDirectory(dir) && Files.isRegularFile(dir.resolve("client_config.json"))) {
                return dir;
            }
        }
        return null;
    }

    private static String b64url(byte[] in) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(in);
    }

    private static byte[][] toPkArray(List<String> hexList) {
        byte[][] arr = new byte[hexList.size()][];
        for (int i = 0; i < hexList.size(); i++) arr[i] = Hex.fromHex(hexList.get(i));
        return arr;
    }
}
