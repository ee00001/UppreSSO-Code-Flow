package sdk.rfc9380;

import org.bouncycastle.jce.spec.ECParameterSpec;
import org.bouncycastle.math.ec.ECFieldElement;
import org.bouncycastle.math.ec.ECPoint;

import java.io.ByteArrayOutputStream;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;

public class Rfc9380Common {

    private Rfc9380Common() {
        // 工具类禁止实例化
    }

    /** 生成 DST' = DST || len(DST) */
    public static byte[] computeDSTPrime(byte[] dst) {
        byte[] dstPrime = Arrays.copyOf(dst, dst.length + 1);
        dstPrime[dst.length] = (byte) dst.length;
        return dstPrime;
    }

    /** expand_message_xmd (基于 SHA-256) */
    public static byte[] expand_message_xmd(byte[] msg, byte[] dstPrime, int len) {
        try {
            if (dstPrime.length > 255 || len > 65535) {
                throw new IllegalArgumentException("dst/len too long");
            }
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            int ell = (len + 31) / 32; // ceil(len/32)

            byte[] lenBytes = i2osp(len, 2);
            byte[] Zpad = new byte[64];

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            baos.write(Zpad);
            baos.write(msg);
            baos.write(lenBytes);
            baos.write((byte) 0x00);
            baos.write(dstPrime);
            byte[] msgPrime = baos.toByteArray();

            // b0 = H(msgPrime)
            byte[] b0 = md.digest(msgPrime);

            // b1 = H(b0 || 0x01 || DST')
            md.reset();
            md.update(b0);
            md.update((byte) 0x01);
            md.update(dstPrime);
            byte[] bi = md.digest();

            byte[] out = new byte[len];
            System.arraycopy(bi, 0, out, 0, Math.min(32, len));

            for (int i = 2; i <= ell; i++) {
                byte[] tmp = xor(b0, bi);
                md.reset();
                md.update(tmp);
                md.update((byte) i);
                md.update(dstPrime);
                bi = md.digest();
                int copyLen = Math.min(32, len - (i - 1) * 32);
                System.arraycopy(bi, 0, out, (i - 1) * 32, copyLen);
            }
            return out;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /** I2OSP 大端 */
    private static byte[] i2osp(int v, int len) {
        byte[] b = new byte[len];
        for (int i = 0; i < len; i++) {
            b[i] = (byte) (v >> (8 * (len - 1 - i)));
        }
        return b;
    }

    /** XOR */
    private static byte[] xor(byte[] a, byte[] b) {
        byte[] c = new byte[a.length];
        for (int i = 0; i < a.length; i++) c[i] = (byte) (a[i] ^ b[i]);
        return c;
    }

    /** 转固定长度 hex 字符串 */
    public static String toFixedLengthHex(BigInteger n, int byteLen) {
        String hex = n.toString(16);
        int expectedLen = byteLen * 2;
        if (hex.length() < expectedLen) {
            StringBuilder sb = new StringBuilder(expectedLen);
            for (int i = 0; i < expectedLen - hex.length(); i++) {
                sb.append('0');
            }
            sb.append(hex);
            return sb.toString();
        } else if (hex.length() > expectedLen) {
            return hex.substring(hex.length() - expectedLen);
        } else {
            return hex;
        }
    }

}
