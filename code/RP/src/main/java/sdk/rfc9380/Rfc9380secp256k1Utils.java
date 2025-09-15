package sdk.rfc9380;

import org.bouncycastle.math.ec.ECPoint;

import java.nio.charset.StandardCharsets;

public class Rfc9380secp256k1Utils {

    private static final byte[] DST = "QUUX-V01-CS02-with-secp256k1_XMD:SHA-256_SSWU_RO_"
            .getBytes(StandardCharsets.US_ASCII);

    public static ECPoint hashToCurve(byte[] msg) {
        // 返回 org.bouncycastle.math.ec.ECPoint 的椭圆曲线点
        return Rfc9380secp256k1.hash_to_curve(msg, DST);
    }

    public static ECPoint hashToCurve(String msg) {
        return hashToCurve(msg.getBytes(StandardCharsets.US_ASCII));
    }

}
