package sdk.rfc9380;


import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.spec.ECParameterSpec;
import org.bouncycastle.math.ec.ECFieldElement;
import org.bouncycastle.math.ec.ECPoint;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class Rfc9380secp256k1 {

    private static final int L_BYTES = 48;

    // secp256k1 参数
    private static final BigInteger P = new BigInteger(
            "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F", 16);
    private static final BigInteger A = BigInteger.ZERO;
    private static final BigInteger B = BigInteger.valueOf(7);
    private static final BigInteger Z = BigInteger.valueOf(-11); // RFC 推荐 Z=-11 mod p

    private static final ECParameterSpec PARAMS = ECNamedCurveTable.getParameterSpec("secp256k1");

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

    /** simplified-SWU 映射 secp256k1 专用 */
    public static ECPoint map_to_curve_simple_swu(BigInteger u) {
        org.bouncycastle.math.ec.ECCurve curve = PARAMS.getCurve();
        BigInteger pField = curve.getField().getCharacteristic();

        ECFieldElement Afe = curve.getA();
        ECFieldElement Bfe = curve.getB();
        ECFieldElement zFe = curve.fromBigInteger(Z.mod(P));
        ECFieldElement uFe = curve.fromBigInteger(u.mod(pField));

        ECFieldElement u2 = uFe.square();
        ECFieldElement u4 = u2.square();
        ECFieldElement den = zFe.multiply(u4).add(u2);  // den = Z*u^4 + u^2

        ECFieldElement x, y;

        if (den.isZero()) {
            // exceptional case
            x = uFe; // 可选：用 u 作为 x
            ECFieldElement gx = x.square().add(Bfe);      // A=0 -> x^3 + B = x^2 + B ?
            y = gx.sqrt();
            if (y == null) throw new IllegalStateException("exceptional case QR fail");
        } else {
            // x1 = -B / den
            ECFieldElement x1 = Bfe.negate().divide(den);
            ECFieldElement gx1 = x1.square().add(Bfe);
            ECFieldElement y1 = gx1.sqrt();
            if (y1 != null) {
                x = x1;
                y = y1;
            } else {
                // fallback candidate x2 = Z * u^2 * x1
                ECFieldElement x2 = zFe.multiply(u2).multiply(x1);
                ECFieldElement gx2 = x2.square().multiply(x2).add(Bfe); // x^3 + B
                ECFieldElement y2 = gx2.sqrt();
                if (y2 == null) throw new IllegalStateException("2nd candidate QR fail");
                x = x2;
                y = y2;
            }

        }

        BigInteger yBig = y.toBigInteger().mod(P);
        if (u.testBit(0) != yBig.testBit(0)) yBig = P.subtract(yBig);

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
        byte[] dst = "QUUX-V01-CS02-with-secp256k1_XMD:SHA-256_SSWU_RO_".getBytes(StandardCharsets.US_ASCII);

        HashToCurveResult result = hash_to_curve_debug(msg, dst);

        int COORD_BYTES = 32;

        System.out.println("u0 = " + Rfc9380Common.toFixedLengthHex(result.u0, COORD_BYTES));
        System.out.println("want  ea67a7c02f2cd5d8b87715c169d055a22520f74daeb080e6180958380e2f98b9");
        System.out.println("u1 = " + Rfc9380Common.toFixedLengthHex(result.u1, COORD_BYTES));
        System.out.println("want  7434d0d1a500d38380d1f9615c021857ac8d546925f5f2355319d823a478da18");

        System.out.println("Q0.x = " + Rfc9380Common.toFixedLengthHex(result.Q0.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q0.y = " + Rfc9380Common.toFixedLengthHex(result.Q0.getAffineYCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q1.x = " + Rfc9380Common.toFixedLengthHex(result.Q1.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q1.y = " + Rfc9380Common.toFixedLengthHex(result.Q1.getAffineYCoord().toBigInteger(), COORD_BYTES));
        System.out.println("P.x = " + Rfc9380Common.toFixedLengthHex(result.P.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("P.y = " + Rfc9380Common.toFixedLengthHex(result.P.getAffineYCoord().toBigInteger(), COORD_BYTES));
    }


}
