package sdk.rfc9380;


import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.spec.ECParameterSpec;
import org.bouncycastle.math.ec.ECCurve;
import org.bouncycastle.math.ec.ECFieldElement;
import org.bouncycastle.math.ec.ECPoint;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;


public class Rfc9380secp256k1 {

    private static final int L_BYTES = 48;

    // prime p for secp256k1
    private static final BigInteger P = new BigInteger("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F", 16);

    // secp256k1 curve params
    private static final BigInteger A = BigInteger.ZERO;
    private static final BigInteger B = BigInteger.valueOf(7);

    // E' parameters (from RFC 9380 Section 8.7)
    private static final BigInteger A_PRIME = new BigInteger("3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533", 16);
    private static final BigInteger B_PRIME = BigInteger.valueOf(1771);

    // Z constant (RFC recommends -11)
    private static final BigInteger Z_BI = BigInteger.valueOf(-11).mod(P);

    // ECCurve for target E and for E'
    private static final ECParameterSpec PARAMS = ECNamedCurveTable.getParameterSpec("secp256k1");
    private static final ECCurve CURVE_E = PARAMS.getCurve();
    private static final ECCurve CURVE_EPRIME = new ECCurve.Fp(P, A_PRIME.mod(P), B_PRIME.mod(P));

    // Constants for 3-isogeny (Appendix E.1)
    private static final BigInteger K1_0 = new BigInteger("8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7", 16);
    private static final BigInteger K1_1 = new BigInteger("7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581", 16);
    private static final BigInteger K1_2 = new BigInteger("534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262", 16);
    private static final BigInteger K1_3 = new BigInteger("8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c", 16);


    private static final BigInteger K2_0 = new BigInteger("d35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b", 16);
    private static final BigInteger K2_1 = new BigInteger("edadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14", 16);


    private static final BigInteger K3_0 = new BigInteger("4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c", 16);
    private static final BigInteger K3_1 = new BigInteger("c75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3", 16);
    private static final BigInteger K3_2 = new BigInteger("29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931", 16);
    private static final BigInteger K3_3 = new BigInteger("2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84", 16);


    private static final BigInteger K4_0 = new BigInteger("fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b", 16);
    private static final BigInteger K4_1 = new BigInteger("7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573", 16);
    private static final BigInteger K4_2 = new BigInteger("6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f", 16);

    // exponent constant for sqrt_ratio_3mod4: c1 = (p-3)/4
    private static final BigInteger C1 = P.subtract(BigInteger.valueOf(3)).divide(BigInteger.valueOf(4));

    // helper: convert BigInteger -> ECFieldElement on given curve
    private static ECFieldElement fe(ECCurve c, BigInteger x) {
        return c.fromBigInteger(x.mod(P));
    }

    // pow for field element: fe^e (computed via underlying integer modPow)
    private static ECFieldElement powFE(ECCurve c, ECFieldElement fe, BigInteger e) {
        BigInteger v = fe.toBigInteger().modPow(e, P);
        return c.fromBigInteger(v);
    }

    // sgn0 as RFC: LSB of representative
    private static int sgn0(ECFieldElement fe) {
        return fe.toBigInteger().testBit(0) ? 1 : 0;
    }

    /*
     * sqrt_ratio optimized for q = 3 mod 4 (F.2.1.2)
     * returns pair (isSquare, y) where y^2 = u/v if isSquare else y^2 = Z*(u/v)
     */
    private static class SqrtRatioResult {
        boolean isSquare;
        ECFieldElement y;


        SqrtRatioResult(boolean isSquare, ECFieldElement y) {
            this.isSquare = isSquare;
            this.y = y;
        }
    }

    private static SqrtRatioResult sqrt_ratio_3mod4(ECCurve c, ECFieldElement u, ECFieldElement v) {
        // c1 = (q-3)/4 computed above
        // c2 = sqrt(-Z) in the same field
        ECFieldElement c2 = fe(c, P.subtract(Z_BI)).sqrt(); // sqrt(-Z mod p)

        ECFieldElement tv1 = v.square(); // v^2
        ECFieldElement tv2 = u.multiply(v); // u*v
        tv1 = tv1.multiply(tv2); // v^2 * (u*v) = u * v^3

        // y1 = (tv1^c1) * tv2
        ECFieldElement y1 = powFE(c, tv1, C1).multiply(tv2);

        // y2 = y1 * c2
        ECFieldElement y2 = y1.multiply(c2);

        ECFieldElement tv3 = y1.square().multiply(v);
        boolean isQR = tv3.toBigInteger().equals(u.toBigInteger());

        ECFieldElement y = isQR ? y1 : y2;

        System.out.println("sqrt_ratio_3mod4 debug:");
        System.out.println("u=" + u.toBigInteger());
        System.out.println("v=" + v.toBigInteger());
        System.out.println("tv1=" + tv1.toBigInteger());
        System.out.println("tv2=" + tv2.toBigInteger());
        System.out.println("y1=" + y1.toBigInteger());
        System.out.println("y2=" + y2.toBigInteger());
        System.out.println("tv3=" + tv3.toBigInteger());
        System.out.println("isQR=" + isQR);
        System.out.println("y=" + y.toBigInteger());

        return new SqrtRatioResult(isQR, y);
    }

    /**
     * Simplified SWU map onto E′ (RFC 9380, Sec 6.6.2), straight-line version (F.2).
     * Input: u ∈ Fp
     * Output: Q′ ∈ E′(Fp)
     */
    public static ECPoint mapToCurveSSWU_Eprime(BigInteger uBI) {
        ECFieldElement A = fe(CURVE_EPRIME, A_PRIME);
        ECFieldElement B = fe(CURVE_EPRIME, B_PRIME);
        ECFieldElement Z = fe(CURVE_EPRIME, Z_BI);

        System.out.println("uBi=" +  uBI);

        ECFieldElement u = fe(CURVE_EPRIME, uBI);

        System.out.println("u=" +  u.toBigInteger());

        // Step 1: tv1 = Z * u^2
        ECFieldElement tv1 = u.square().multiply(Z);

        // Step 2: tv2 = tv1^2
        ECFieldElement tv2 = tv1.square();

        // Step 3: x1 = tv1 + tv2
        ECFieldElement x1 = tv1.add(tv2);

        // Step 4: x1 = inv0(x1)
        ECFieldElement x1Inv = x1.invert();
        if (x1.isZero()) {
            x1Inv = Z.invert(); // per inv0 definition
        }

        ECFieldElement x2;
        // Step 5
        if(!x1Inv.isZero()) {
            // x2 = -B / A * (1 + x1Inv)
            x2 = B.negate().multiply(x1Inv.add(fe(CURVE_EPRIME, BigInteger.ONE))).multiply(A.invert());
        }else{
            // x2 = B / (Z * A)
            x2 = B.multiply(Z.invert()).multiply(A.invert());
        }

        // Step 6: x3 = Z * u^2 * x2
        ECFieldElement x3 = tv1.multiply(x2);

        // Step 7: gx1 = x2^3 + A*x2 + B
        ECFieldElement gx1 = x2.square().multiply(x2).add(A.multiply(x2)).add(B);

        // Step 8: gx2 = x3^3 + A*x3 + B
        ECFieldElement gx2 = x3.square().multiply(x3).add(A.multiply(x3)).add(B);

        // Step 9: (isSquare, y1) = sqrt_ratio(gx1, 1)
        SqrtRatioResult sqrtRes = sqrt_ratio_3mod4(CURVE_EPRIME, gx1, fe(CURVE_EPRIME, BigInteger.ONE));

        ECFieldElement x = sqrtRes.isSquare ? x2 : x3;
        ECFieldElement y = sqrtRes.isSquare ? sqrtRes.y : sqrt_ratio_3mod4(CURVE_EPRIME, gx2, fe(CURVE_EPRIME, BigInteger.ONE)).y;

        System.out.println("tv1=" + tv1.toBigInteger() + ", tv2=" + tv2.toBigInteger() + ", x1=" + x1.toBigInteger() + ", x1Inv=" + x1Inv.toBigInteger());
        System.out.println("x2=" + x2.toBigInteger() + ", x3=" + x3.toBigInteger());
        System.out.println("gx1=" + gx1.toBigInteger() + ", gx2=" + gx2.toBigInteger());

        // Step 11: Fix sign of y
        if (sgn0(u) != sgn0(y)) {
            y = y.negate();
        }

        System.out.println("x=" + x.toBigInteger() + ", y=" + y.toBigInteger() + ", isSquare=" + sqrtRes.isSquare);

        return CURVE_EPRIME.createPoint(x.toBigInteger().mod(P), y.toBigInteger().mod(P));
    }

    /**
     * 3-isogeny map from E' to E as specified in Appendix E.1
     * Input: point on E' (ECPoint from CURVE_EPRIME)
     * Output: point on secp256k1 (ECPoint on CURVE_E)
     */
    public static ECPoint isoMap(ECPoint qPrime) {
        if (qPrime.isInfinity()) return CURVE_E.getInfinity();


        ECFieldElement xP = CURVE_E.fromBigInteger(qPrime.getAffineXCoord().toBigInteger());
        ECFieldElement yP = CURVE_E.fromBigInteger(qPrime.getAffineYCoord().toBigInteger());

        System.out.println("xP=" + xP.toBigInteger() + ", yP=" + yP.toBigInteger());

        // prepare constant field elements on target curve
        ECFieldElement k13 = CURVE_E.fromBigInteger(K1_3);
        ECFieldElement k12 = CURVE_E.fromBigInteger(K1_2);
        ECFieldElement k11 = CURVE_E.fromBigInteger(K1_1);
        ECFieldElement k10 = CURVE_E.fromBigInteger(K1_0);

        ECFieldElement k21 = CURVE_E.fromBigInteger(K2_1);
        ECFieldElement k20 = CURVE_E.fromBigInteger(K2_0);

        ECFieldElement k33 = CURVE_E.fromBigInteger(K3_3);
        ECFieldElement k32 = CURVE_E.fromBigInteger(K3_2);
        ECFieldElement k31 = CURVE_E.fromBigInteger(K3_1);
        ECFieldElement k30 = CURVE_E.fromBigInteger(K3_0);

        ECFieldElement k42 = CURVE_E.fromBigInteger(K4_2);
        ECFieldElement k41 = CURVE_E.fromBigInteger(K4_1);
        ECFieldElement k40 = CURVE_E.fromBigInteger(K4_0);

        // compute powers
        ECFieldElement x2 = xP.square();
        ECFieldElement x3 = x2.multiply(xP);

        System.out.println("x2=" + x2.toBigInteger() + ", x3=" + x3.toBigInteger());

        // x_num = k13 * x'^3 + k12 * x'^2 + k11 * x' + k10
        ECFieldElement xNum = k13.multiply(x3).add(k12.multiply(x2)).add(k11.multiply(xP)).add(k10);

        // x_den = x'^2 + k21 * x' + k20
        ECFieldElement xDen = x2.add(k21.multiply(xP)).add(k20);

        // y_num = k33 * x'^3 + k32 * x'^2 + k31 * x' + k30
        ECFieldElement yNum = k33.multiply(x3).add(k32.multiply(x2)).add(k31.multiply(xP)).add(k30);

        // y_den = x'^3 + k42 * x'^2 + k41 * x' + k40
        ECFieldElement yDen = x3.add(k42.multiply(x2)).add(k41.multiply(xP)).add(k40);

        // exceptional cases: denominators zero -> return infinity (RFC requires this)
        if (xDen.toBigInteger().equals(BigInteger.ZERO) || yDen.toBigInteger().equals(BigInteger.ZERO)) {
            return CURVE_E.getInfinity();
        }

        ECFieldElement xMapped = xNum.multiply(xDen.invert());

        ECFieldElement yMapped = yP.multiply(yNum).multiply(yDen.invert());

        System.out.println("xNum=" + xNum.toBigInteger() + ", xDen=" + xDen.toBigInteger());
        System.out.println("yNum=" + yNum.toBigInteger() + ", yDen=" + yDen.toBigInteger());
        System.out.println("xMapped=" + xMapped.toBigInteger() + ", yMapped=" + yMapped.toBigInteger());

        BigInteger xMappedBI = xMapped.toBigInteger().mod(P);
        BigInteger yMappedBI = yMapped.toBigInteger().mod(P);

        return CURVE_E.createPoint(xMappedBI, yMappedBI).normalize();
    }

    // ---------- RFC9380 full flow helpers ----------
    public static ECPoint hash_to_curve(byte[] msg, byte[] dst) {
        byte[] dstPrime = Rfc9380Common.computeDSTPrime(dst);
        int count = 2;
        byte[] uniform = Rfc9380Common.expand_message_xmd(msg, dstPrime, count * L_BYTES);

        BigInteger u0 = new BigInteger(1, Arrays.copyOfRange(uniform, 0, L_BYTES)).mod(P);
        BigInteger u1 = new BigInteger(1, Arrays.copyOfRange(uniform, L_BYTES, 2 * L_BYTES)).mod(P);

        ECPoint q0Prime = mapToCurveSSWU_Eprime(u0);
        ECPoint q1Prime = mapToCurveSSWU_Eprime(u1);

        ECPoint p0 = isoMap(q0Prime);
        ECPoint p1 = isoMap(q1Prime);

        return p0.add(p1).normalize();
    }

    public static class HashToCurveResult {
        public final BigInteger u0;
        public final BigInteger u1;
        public final ECPoint Q0prime;
        public final ECPoint Q1prime;
        public final ECPoint Q0; // mapped to secp256k1
        public final ECPoint Q1;
        public final ECPoint P;


        public HashToCurveResult(BigInteger u0, BigInteger u1, ECPoint Q0prime, ECPoint Q1prime, ECPoint Q0, ECPoint Q1, ECPoint P) {
            this.u0 = u0;
            this.u1 = u1;
            this.Q0prime = Q0prime;
            this.Q1prime = Q1prime;
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

        ECPoint q0Prime = mapToCurveSSWU_Eprime(u0);
        ECPoint q1Prime = mapToCurveSSWU_Eprime(u1);

        ECPoint q0 = isoMap(q0Prime);
        ECPoint q1 = isoMap(q1Prime);
        ECPoint Ppoint = q0.add(q1).normalize();

        return new HashToCurveResult(u0, u1, q0Prime, q1Prime, q0, q1, Ppoint);
    }


    // ---------- quick test main ----------
    public static void main(String[] args) {
        byte[] msg = "http://localhost:8090".getBytes(StandardCharsets.US_ASCII);
        byte[] dst = "QUUX-V01-CS02-with-secp256k1_XMD:SHA-256_SSWU_RO_".getBytes(StandardCharsets.US_ASCII);

        HashToCurveResult result = hash_to_curve_debug(msg, dst);

        int COORD_BYTES = 32;

        System.out.println("u0 = " + Rfc9380Common.toFixedLengthHex(result.u0, COORD_BYTES));
        System.out.println("u1 = " + Rfc9380Common.toFixedLengthHex(result.u1, COORD_BYTES));

        System.out.println("Q0prime.x = " + Rfc9380Common.toFixedLengthHex(result.Q0prime.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q0prime.y = " + Rfc9380Common.toFixedLengthHex(result.Q0prime.getAffineYCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q1prime.x = " + Rfc9380Common.toFixedLengthHex(result.Q1prime.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q1prime.y = " + Rfc9380Common.toFixedLengthHex(result.Q1prime.getAffineYCoord().toBigInteger(), COORD_BYTES));

        System.out.println("Q0.x = " + Rfc9380Common.toFixedLengthHex(result.Q0.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q0.y = " + Rfc9380Common.toFixedLengthHex(result.Q0.getAffineYCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q1.x = " + Rfc9380Common.toFixedLengthHex(result.Q1.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("Q1.y = " + Rfc9380Common.toFixedLengthHex(result.Q1.getAffineYCoord().toBigInteger(), COORD_BYTES));
        System.out.println("P.x = " + Rfc9380Common.toFixedLengthHex(result.P.getAffineXCoord().toBigInteger(), COORD_BYTES));
        System.out.println("P.y = " + Rfc9380Common.toFixedLengthHex(result.P.getAffineYCoord().toBigInteger(), COORD_BYTES));
    }
}
