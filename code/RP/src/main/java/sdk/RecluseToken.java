package sdk;

import com.auth0.jwt.interfaces.Claim;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.spec.ECParameterSpec;
import org.bouncycastle.math.ec.ECPoint;


import java.math.BigInteger;
import java.util.Date;
import java.util.List;
import java.util.Map;

public class RecluseToken {
    private List<String> audience;
    private String algorithm;
    private Map<String, Claim> claims;
    private String contentType;
    private Date expireAt;
    private String id;
    private Date issuedAt;
    private String issuer;
    private String keyID;
    private Date notBefore;
    private String subject;
    private String type;
    private boolean valid;

    public void init(DecodedJWT token, String t) {
        audience = token.getAudience();
        algorithm = token.getAlgorithm();
        claims = token.getClaims();
        contentType = token.getContentType();
        expireAt = token.getExpiresAt();
        id = token.getId();
        issuedAt = token.getIssuedAt();
        issuer = token.getIssuer();
        keyID = token.getKeyId();
        notBefore = token.getNotBefore();
        type = token.getType();
        subject = parseSubject(token.getSubject(), t);
    }

    private String parseSubject(String subject, String t) {
        ECParameterSpec ecParameterSpec = ECNamedCurveTable.getParameterSpec("secp256k1");
        ECPoint point = ecParameterSpec.getCurve().decodePoint(hexStringToByteArray(subject));
        BigInteger n = ecParameterSpec.getN();
//        BigInteger t_inv = ExtendEculid(new BigInteger(t, 10), n)[1];
        BigInteger t_inv = new BigInteger(t, 10).modInverse(n);
        ECPoint point_inverse = point.multiply(t_inv);
        return bytesToHex(point_inverse.getEncoded(false));
    }

    public static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static byte[] hexStringToByteArray(String s) {
        int len = s.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                    + Character.digit(s.charAt(i+1), 16));
        }
        return data;
    }

//    改用 BigInteger#modInverse 方法，未测试正确性，暂时保留原方法
//    public BigInteger[] ExtendEculid(BigInteger a, BigInteger b)
//    {
//        BigInteger x,  y;
//        if (b.compareTo(new BigInteger("0"))==0)
//        {
//            x = new BigInteger("1");
//            y = new BigInteger("0");
//            BigInteger[] t = new BigInteger[3];
//            t[0] = a; t[1] = x; t[2] = y;
//            return t;
//        }
//        BigInteger[] t = ExtendEculid(b, a.mod(b));
//        BigInteger result = t[0];
//        x = t[1];
//        y = t[2];
//        BigInteger temp = x;
//        x = y;
//        y = temp.subtract(a.divide(b).multiply(y));
//        BigInteger[] t1 = new BigInteger[3];
//        t1[0] = result; t1[1] = x; t1[2] = y;
//        return t1;
//    }

    public List<String> getAudience() {
        return audience;
    }

    public void setAudience(List<String> audience) {
        this.audience = audience;
    }

    public String getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(String algorithm) {
        this.algorithm = algorithm;
    }

    public Map<String, Claim> getClaims() {
        return claims;
    }

    public void setClaims(Map<String, Claim> claims) {
        this.claims = claims;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Date getExpireAt() {
        return expireAt;
    }

    public void setExpireAt(Date expireAt) {
        this.expireAt = expireAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Date getIssuedAt() {
        return issuedAt;
    }

    public void setIssuedAt(Date issuedAt) {
        this.issuedAt = issuedAt;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getKeyID() {
        return keyID;
    }

    public void setKeyID(String keyID) {
        this.keyID = keyID;
    }

    public Date getNotBefore() {
        return notBefore;
    }

    public void setNotBefore(Date notBefore) {
        this.notBefore = notBefore;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean isvalid) {
        this.valid = isvalid;
    }

}
