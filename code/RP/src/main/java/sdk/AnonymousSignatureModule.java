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

                RingKeyStore ks = new RingKeyStore(signerDir, cfg.n);
                ks.assertPublicKeysExist();

                byte[][] onlinePks  = ks.loadOnlinePks();
                byte[][] offlinePks = ks.loadOfflinePks();
                byte[]   subPk33    = ks.loadSubPk();

                byte[] onlineSk32 = ks.loadOnlineSk32(cfg.index);
                byte[] summedSk32 = ks.loadSummedSk32(cfg.index);

                Secp256k1Ring.requireLibraryLoaded();
                byte[] sig = Secp256k1Ring.whitelistSignMsg(
                        onlinePks, offlinePks, subPk33,
                        onlineSk32, summedSk32, cfg.index,
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

    private static String b64url(byte[] in) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(in);
    }
}
