package org.example;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTCreator;
import com.auth0.jwt.algorithms.Algorithm;
import org.bouncycastle.jce.interfaces.ECPrivateKey;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.math.ec.ECPoint;

import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.security.spec.ECGenParameterSpec;

public class Main {
    static ECPrivateKey ecPrivateKey ;
    static ECPublicKey ecPublicKey ;


    public static BigInteger[] ExtendEculid(BigInteger a, BigInteger b)
    {
        BigInteger x,  y;
        if (b.compareTo(new BigInteger("0"))==0)
        {
            x = new BigInteger("1");
            y = new BigInteger("0");
            BigInteger[] t = new BigInteger[3];
            t[0] = a; t[1] = x; t[2] = y;
            return t;
        }
        BigInteger[] t = ExtendEculid(b, a.mod(b));
        BigInteger result = t[0];
        x = t[1];
        y = t[2];
        BigInteger temp = x;
        x = y;
        y = temp.subtract(a.divide(b).multiply(y));
        BigInteger[] t1 = new BigInteger[3];
        t1[0] = result; t1[1] = x; t1[2] = y;
        return t1;
    }


    public static void main(String[] args) {

        String ec = generateNISTP256Curve();
//        System.out.println(generateNISTP256Curve());
//        String jwt = generateJWT(ec);
//        System.out.println("Generated JWT: " + jwt);
    }




    //生成NIST P-256椭圆曲线
    public static String generateNISTP256Curve() {
        try {
            Security.addProvider(new BouncyCastleProvider());

            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("EC", "BC");
//            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("EC");
            ECGenParameterSpec ecSpec = new ECGenParameterSpec("secp256k1");
            keyGen.initialize(ecSpec);
            KeyPair pair = keyGen.generateKeyPair();
            ecPrivateKey = (ECPrivateKey) pair.getPrivate();
            ecPublicKey = (ECPublicKey) pair.getPublic();

            ECPoint point = ecPublicKey.getQ();
            String encoded = bytesToHex(point.getEncoded(false));
            System.out.println("Point: " + encoded);

            String t = "303e020100301006072a8648ce3d020106052b8104000a0427302502010104208c59df7d7a252f1f670bb8f4bb0c57e26f1f60e87bc54803bcc441375079317e";
            ECPoint trans = point.multiply(new BigInteger(t, 16));
            String transEncoded = bytesToHex(trans.getEncoded(false));
            System.out.println("Transformed Point: " + transEncoded);


            BigInteger n = ((ECPublicKey) ecPublicKey).getParameters().getN();
            System.out.println("Field Characteristic (p): " + n.toString(16));
            BigInteger t_verse = ExtendEculid(new BigInteger(t, 16), n)[1];
            System.out.println("Inverse of t: " + t_verse.toString(16));

            BigInteger x = new BigInteger(t, 16).multiply(t_verse).mod(n);
            System.out.println("x = t * t_verse mod p: " + x.toString(16));

            ECPoint point_verse = trans.multiply(t_verse);
            String point_verseEncoded = bytesToHex(point_verse.getEncoded(false));
            System.out.println("Point after multiplication with inverse of t: " + point_verseEncoded);


//            ECParameterSpec params = ecPublicKey.getParams();
//            int fieldSize = (params.getCurve().getField().getFieldSize() + 7) / 8;
//            byte[] x = toFixedLength(point.getAffineX(), fieldSize);
//            byte[] y = toFixedLength(point.getAffineY(), fieldSize);

//            byte[] encoded = new byte[1 + x.length + y.length];
//            encoded[0] = 0x04;
//            System.arraycopy(x, 0, encoded, 1, x.length);
//            System.arraycopy(y, 0, encoded, 1 + x.length, y.length);
//            System.out.println("pk: " + bytesToHex(encoded));


//            ECPoint trans = point.multiply(new BigInteger("2"));



//            // 输出公钥的十六进制字符串
//            System.out.println("Public Key: " + bytesToHex(ecPublicKey.getEncoded()));
//            // 输出私钥的十六进制字符串
//            System.out.println("Private Key: " + bytesToHex(ecPrivateKey.getEncoded()));
            return encoded;
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }

    private static byte[] toFixedLength(BigInteger value, int length) {
        byte[] src = value.toByteArray();
        if (src.length == length) return src;
        byte[] dst = new byte[length];
        if (src.length > length) {
            System.arraycopy(src, src.length - length, dst, 0, length);
        } else {
            System.arraycopy(src, 0, dst, length - src.length, src.length);
        }
        return dst;
    }

    //生成JWT
//    public static String generateJWT(String subject) {
//        JWTCreator.Builder jwt = JWT.create();
//        //为jwt添加attributes
//        return jwt.withIssuer("http://localhost:8090")
//                .withClaim("RP_ID", subject)
//                .withClaim("redirect_uri", "http://localhost:8090")
//                .withClaim("RP_name", "prototype")
//                .withIssuedAt(new java.util.Date())
//                .sign(Algorithm.ECDSA256(ecPublicKey, ecPrivateKey));
//    }

    public static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }



}