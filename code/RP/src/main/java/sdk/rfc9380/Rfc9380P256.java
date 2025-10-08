package sdk.rfc9380;

import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.spec.ECParameterSpec;
import org.bouncycastle.math.ec.ECFieldElement;
import org.bouncycastle.math.ec.ECPoint;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;


public final class Rfc9380P256 {

    private static final int L_BYTES = 48;

    private static final BigInteger P = new BigInteger("FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF", 16);
    private static final BigInteger Z = P.subtract(BigInteger.valueOf(10));

    private static final ECParameterSpec PARAMS = ECNamedCurveTable.getParameterSpec("secp256r1");

    public static class HashToCurveResult {
        public final BigInteger u0;
        public final BigInteger u1;
        public final ECPoint Q0;
        public final ECPoint Q1;
        public final ECPoint P;

        public HashToCurveResult(BigInteger u0, BigInteger u1, ECPoint Q0, ECPoint Q1, ECPoint P) {
            this.u0 = u0;
            this.u1 = u1;
            this.Q0 = Q0;
            this.Q1 = Q1;
            this.P = P;
        }
    }

    public static HashToCurveResult hash_to_curve_debug(byte[] msg, byte[] dst) {
        byte[] dstPrime = Rfc9380Common.computeDSTPrime(dst);

        int count = 2;
        byte[] uniform = Rfc9380Common.expand_message_xmd(msg, dstPrime, count * L_BYTES);

        BigInteger u0 = new BigInteger(1, Arrays.copyOfRange(uniform, 0, L_BYTES)).mod(P);
        BigInteger u1 = new BigInteger(1, Arrays.copyOfRange(uniform, L_BYTES, 2 * L_BYTES)).mod(P);

        ECPoint Q0 = map_to_curve_simple_swu(u0);
        ECPoint Q1 = map_to_curve_simple_swu(u1);
        ECPoint Ppoint = Q0.add(Q1).normalize();   // cofactor=1

        return new HashToCurveResult(u0, u1, Q0, Q1, Ppoint);
    }

    // simple_swu
    public static ECPoint map_to_curve_simple_swu(BigInteger u) {
        org.bouncycastle.math.ec.ECCurve curve = PARAMS.getCurve();
        BigInteger pField = curve.getField().getCharacteristic();

        ECFieldElement Afe = curve.getA();
        ECFieldElement Bfe = curve.getB();

        ECFieldElement zFe   = curve.fromBigInteger(Z);
        ECFieldElement c1 = Bfe.divide(Afe); // B / A

        ECFieldElement uFe = curve.fromBigInteger(u.mod(pField));
        ECFieldElement u2  = uFe.square();
        ECFieldElement Zu2 = zFe.multiply(u2);
        ECFieldElement den = Zu2.multiply(zFe.multiply(u2).add(curve.fromBigInteger(BigInteger.ONE))); // Z²u⁴ + Zu²

        if (den.isZero()) {          // 异常分支 u=0 或 Z²u⁴+Zu²=0
            ECFieldElement x1 = c1.divide(zFe);        // x1 = B/(Z·A)
            ECFieldElement gx1 = x1.square().add(Afe).multiply(x1).add(Bfe);
            ECFieldElement y1 = gx1.sqrt();
            if (y1 == null) throw new IllegalStateException("exceptional case QR fail");
            BigInteger yBig = y1.toBigInteger().mod(P);
            if (yBig.testBit(0)) yBig = P.subtract(yBig);
            return curve.createPoint(x1.toBigInteger().mod(P), yBig).normalize();
        }
        ECFieldElement tv1 = den.invert();

        // x1 = (-B/A) * (1 + tv1)
        ECFieldElement x1 = c1.negate().multiply(tv1.add(curve.fromBigInteger(BigInteger.ONE)));

        // x2 = Z * u² * x1
        ECFieldElement x2 = Zu2.multiply(x1);

        ECFieldElement gx1 = x1.square().add(Afe).multiply(x1).add(Bfe);
        ECFieldElement y1 = gx1.sqrt();
        final ECFieldElement x, y;
        if (y1 != null) {
            x = x1;
            y = y1;
        } else {
            ECFieldElement gx2 = x2.square().add(Afe).multiply(x2).add(Bfe);
            ECFieldElement y2 = gx2.sqrt();
            if (y2 == null) throw new IllegalStateException("2nd candidate QR fail");
            x = x2;
            y = y2;
        }

        // 调整 y 符号
        BigInteger yBig = y.toBigInteger().mod(P);
        if (u.testBit(0) != yBig.testBit(0)) {   // sgn0(u) != sgn0(y)
            yBig = P.subtract(yBig);
        }
        return curve.createPoint(x.toBigInteger().mod(P), yBig).normalize();
    }


    public static ECPoint hash_to_curve(byte[] msg, byte[] dst) {
        byte[] dstPrime = Rfc9380Common.computeDSTPrime(dst);
        int count = 2;
        byte[] uniform = Rfc9380Common.expand_message_xmd(msg, dstPrime, count * L_BYTES);

        BigInteger u0 = new BigInteger(1, Arrays.copyOfRange(uniform, 0, L_BYTES)).mod(P);
        BigInteger u1 = new BigInteger(1, Arrays.copyOfRange(uniform, L_BYTES, 2 * L_BYTES)).mod(P);

        ECPoint q0 = map_to_curve_simple_swu(u0);
        ECPoint q1 = map_to_curve_simple_swu(u1);
        return q0.add(q1).normalize();
    }

    public static BigInteger hash_to_scalar(byte[] msg, byte[] dst) {
        byte[] dstPrime = Rfc9380Common.computeDSTPrime(dst);
        byte[] buf = Rfc9380Common.expand_message_xmd(msg, dstPrime, L_BYTES);
        return new BigInteger(1, buf).mod(PARAMS.getN());
    }

    public static void main(String[] args) {
        byte[] msg = "abcdef0123456789".getBytes(StandardCharsets.US_ASCII);
        byte[] dst = "QUUX-V01-CS02-with-P256_XMD:SHA-256_SSWU_RO_"
                .getBytes(StandardCharsets.US_ASCII);

        // 简单测试，完整测试使用 Test 文件
        HashToCurveResult result = hash_to_curve_debug(msg, dst);

        int COORD_BYTES = 32; // 曲线坐标长度

        System.out.println("u0 = " + Rfc9380Common.toFixedLengthHex(result.u0, COORD_BYTES));
        System.out.println("want  0fad9d125a9477d55cf9357105b0eb3a5c4259809bf87180aa01d651f53d312c");
        System.out.println("u1 = " + Rfc9380Common.toFixedLengthHex(result.u1, COORD_BYTES));
        System.out.println("want  b68597377392cd3419d8fcc7d7660948c8403b19ea78bbca4b133c9d2196c0fb");

        System.out.println("Q0.x = " + Rfc9380Common.toFixedLengthHex(result.Q0.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q0.y = " + Rfc9380Common.toFixedLengthHex(result.Q0.getAffineYCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q1.x = " + Rfc9380Common.toFixedLengthHex(result.Q1.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q1.y = " + Rfc9380Common.toFixedLengthHex(result.Q1.getAffineYCoord().toBigInteger(), COORD_BYTES));
        System.out.println("P.x = " + Rfc9380Common.toFixedLengthHex(result.P.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("P.y = " + Rfc9380Common.toFixedLengthHex(result.P.getAffineYCoord().toBigInteger(), COORD_BYTES));
    }

    private static String toFixedLengthHex(BigInteger n, int byteLen) {
        String hex = n.toString(16); // 转为十六进制字符串，不带前导 0
        int expectedLen = byteLen * 2; // 每个字节对应 2 个字符
        if (hex.length() < expectedLen) {
            // 补前导零
            StringBuilder sb = new StringBuilder(expectedLen);
            for (int i = 0; i < expectedLen - hex.length(); i++) {
                sb.append('0');
            }
            sb.append(hex);
            return sb.toString();
        } else if (hex.length() > expectedLen) {
            // 如果意外超长，取低位
            return hex.substring(hex.length() - expectedLen);
        } else {
            return hex;
        }
    }

}
