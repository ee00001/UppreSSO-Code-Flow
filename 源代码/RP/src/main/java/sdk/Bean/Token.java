package sdk.Bean;

import com.google.gson.Gson;

import java.security.*;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;

public class Token {
    public class Header{
        String kid;
        String alg;

        public String getKid() {
            return kid;
        }

        public void setKid(String kid) {
            this.kid = kid;
        }

        public String getAlg() {
            return alg;
        }

        public void setAlg(String alg) {
            this.alg = alg;
        }
    }

    public class Body{
        String at_hash;
        String sub;
        String kid;
        String iss;
        String exp;
        String iat;
        String jti;
        String aud;

        public String getAt_hash() {
            return at_hash;
        }

        public void setAt_hash(String at_hash) {
            this.at_hash = at_hash;
        }

        public String getSub() {
            return sub;
        }

        public void setSub(String sub) {
            this.sub = sub;
        }

        public String getKid() {
            return kid;
        }

        public void setKid(String kid) {
            this.kid = kid;
        }

        public String getIss() {
            return iss;
        }

        public void setIss(String iss) {
            this.iss = iss;
        }

        public String getExp() {
            return exp;
        }

        public void setExp(String exp) {
            this.exp = exp;
        }

        public String getIat() {
            return iat;
        }

        public void setIat(String iat) {
            this.iat = iat;
        }

        public String getJti() {
            return jti;
        }

        public void setJti(String jti) {
            this.jti = jti;
        }

        public String getAud() {
            return aud;
        }

        public void setAud(String aud) {
            this.aud = aud;
        }
    }

    Header header;
    Body body;
    String signature;
    String preSignature;
    boolean isValid;

    public Token(String id_token){
        String[] parts = id_token.split("\\.");
        preSignature = parts[0] + "\\." + parts[1];
        Gson gson = new Gson();
        for(int i=0;i<2;i++){
            parts[i] = new String(Base64.getDecoder().decode(parts[i]));
        }
        header = gson.fromJson(parts[0], Header.class);
        body = gson.fromJson(parts[1], Body.class);
        signature = parts[2];
    }

    public Header getHeader(){
        return header;
    }

    public Body getBody(){
        return body;
    }


    public void init(){
        KeyPairGenerator generator = null;
        try {
            generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair keyPair = generator.generateKeyPair();
            RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
            RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(privateKey);
            signature.update(preSignature.getBytes());
            byte[] sign = signature.sign();
            TokenManager.setToken(preSignature);
            TokenManager.setSignature(sign);
            KeyPairManager.setK(keyPair);
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (InvalidKeyException e) {
            e.printStackTrace();
        } catch (SignatureException e) {
            e.printStackTrace();
        }
    }

    public boolean isValid(){
        //return true;
        //long now = date.getTime() / 1000;
        if(true){//now < Long.parseLong(body.getExp())){
            //String pk = "AQAB";//KeyManager.get(body.getIss());
            Signature verifySign = null;
            try {
                verifySign = Signature.getInstance("SHA256withRSA");
                if(KeyPairManager.getK() == null){
                    return true;
                }
                RSAPublicKey publicKey = (RSAPublicKey)KeyPairManager.getK().getPublic();
                verifySign.initVerify(publicKey);
                verifySign.update(TokenManager.getToken().getBytes());
                if(verifySign.verify(TokenManager.getSignature())){
                    return true;
                }
            }  catch (InvalidKeyException e) {
                e.printStackTrace();
            } catch (SignatureException e) {
                e.printStackTrace();
            } catch (NoSuchAlgorithmException e) {
                e.printStackTrace();
            }
        }
        return false;
    }

}
