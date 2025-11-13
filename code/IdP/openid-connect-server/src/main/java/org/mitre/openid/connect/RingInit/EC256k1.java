package org.mitre.openid.connect.RingInit;

import org.bouncycastle.asn1.sec.SECNamedCurves;
import org.bouncycastle.asn1.x9.X9ECParameters;
import org.bouncycastle.crypto.params.ECDomainParameters;
import org.bouncycastle.math.ec.ECPoint;

import java.math.BigInteger;
import java.security.SecureRandom;
import java.util.Arrays;

public final class EC256k1 {

    private static final ECDomainParameters PARAMS;
    public static final BigInteger N;
    public static final ECPoint G;
    private static final SecureRandom RNG = new SecureRandom();

    static {
        // JDK8 不支持 var；显式声明 X9ECParameters
        X9ECParameters x9 = SECNamedCurves.getByName("secp256k1");
        PARAMS = new ECDomainParameters(x9.getCurve(), x9.getG(), x9.getN(), x9.getH());
        N = x9.getN();
        G = x9.getG();
    }

    private EC256k1() {}

    public static BigInteger randomScalar() {
        BigInteger d;
        do {
            d = new BigInteger(N.bitLength(), RNG);
        } while (d.signum() <= 0 || d.compareTo(N) >= 0);
        return d;
    }

    public static ECPoint pubFromPriv(BigInteger d) {
        return G.multiply(d).normalize();
    }

    public static byte[] compress(ECPoint Q) {
        Q = Q.normalize();
        byte[] x = Q.getXCoord().getEncoded();
        if (x.length != 32) x = leftPad32(x);
        byte prefix = (byte) (Q.getYCoord().toBigInteger().testBit(0) ? 0x03 : 0x02);
        byte[] out = new byte[33];
        out[0] = prefix;
        System.arraycopy(x, 0, out, 1, 32);
        return out;
    }

    public static byte[] i2osp32(BigInteger k) {
        byte[] b = k.toByteArray();
        if (b.length == 33 && b[0] == 0) b = Arrays.copyOfRange(b, 1, 33);
        return leftPad32(b);
    }

    public static BigInteger addModN(BigInteger a, BigInteger b) {
        BigInteger s = a.add(b).mod(N);
        if (s.signum() == 0) return addModN(s, BigInteger.ONE); // 避免 0
        return s;
    }

    private static byte[] leftPad32(byte[] in) {
        byte[] out = new byte[32];
        System.arraycopy(in, Math.max(0, in.length - 32), out, Math.max(0, 32 - in.length), Math.min(32, in.length));
        return out;
    }
}
