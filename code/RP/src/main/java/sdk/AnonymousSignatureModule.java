package sdk;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

import sdk.Tools.*;

public final class AnonymousSignatureModule {
    private AnonymousSignatureModule() {}

    public static AnonSigResult buildAssertionOrPptoken(String payloadUtf8) {
        byte[] msg = payloadUtf8.getBytes(StandardCharsets.UTF_8);

        Path signerDir = chooseSignerDir();
        if (signerDir != null) {
            try {
                SignerBundleConfig cfg = SignerBundleConfig.load(signerDir);

                int i = cfg.index;
                byte[] onlineSk32 = readHexFile(signerDir.resolve("online_" + i + ".sk"));
                byte[] summedSk32 = readHexFile(signerDir.resolve("summed_" + i + ".sk"));
                requireLen(onlineSk32, 32, "online_" + i + ".sk");
                requireLen(summedSk32, 32, "summed_" + i + ".sk");

                byte[][] onlinePks  = toPkArray(cfg.onlinePks);
                byte[][] offlinePks = toPkArray(cfg.offlinePks);
                byte[]   subPk33    = Hex.fromHex(cfg.subPk);
                requireLen(subPk33, 33, "subPk33");

                Secp256k1Ring.requireLibraryLoaded();
                byte[] sig = Secp256k1Ring.whitelistSignMsg(
                        onlinePks, offlinePks, subPk33,
                        onlineSk32, summedSk32, i,
                        msg
                );
                return new AnonSigResult("ring", b64url(sig), null);
            } catch (Throwable ringErr) {
            }
        }

        String authz = SidecarClient.acquirePrivateTokenHeader();
        String assertion = "";
        return new AnonSigResult("pptoken", assertion, authz);
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

    private static byte[] readHexFile(Path p) {
        try {
            byte[] ascii = Files.readAllBytes(p);
            String hex = new String(ascii, StandardCharsets.US_ASCII).trim();
            return Hex.fromHex(hex);
        } catch (IOException e) {
            throw new IllegalStateException("读取失败: " + p + " : " + e.getMessage(), e);
        }
    }

    private static void requireLen(byte[] b, int len, String name) {
        if (b == null || b.length != len) {
            throw new IllegalArgumentException(name + " 长度必须是 " + len + " 字节");
        }
    }

    private static byte[][] toPkArray(List<String> hexList) {
        byte[][] arr = new byte[hexList.size()][];
        for (int i = 0; i < hexList.size(); i++) arr[i] = Hex.fromHex(hexList.get(i));
        return arr;
    }

    private static String b64url(byte[] in) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(in);
    }
}
