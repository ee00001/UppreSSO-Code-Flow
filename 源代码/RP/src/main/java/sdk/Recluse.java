package sdk;

import sdk.Bean.DHKey;
import sdk.Bean.DHKeyManager;
import sdk.Tools.Util;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.google.gson.Gson;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

public class Recluse {
    String e = "AQAB";
    String n = "qt6yOiI_wCoCVlGO0MySsez0VkSqhPvDl3rfabOslx35mYEO-n4ABfIT5Gn2zN-CeIcOZ5ugAXvIIRWv5H55-tzjFazi5IKkOIMCiz5__MtsdxKCqGlZu2zt-BLpqTOAPiflNPpM3RUAlxKAhnYEqNha6-allPnFQupnW_eTYoyuzuedT7dSp90ry0ZcQDimntXWeaSbrYKCj9Rr9W1jn2uTowUuXaScKXTCjAmJVnsD75JNzQfa8DweklTyWQF-Y5Ky039I0VIu-0CIGhXY48GAFe2EFb8VpNhf07DP63p138RWQ1d3KPEM9mYJVpQC68j3wzDQYSljpLf9by7TGw";
    String RPCert = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1ZXIiOiJodHRwOi8vMTAuMTAuODEuNDI6ODA4MCIsImJhc2ljX2NsaWVudF9pZCI6IjQwNDE0MjY2NDU2MTI1MDM4NzMyNzcwMDM5ODMwMzg2NjY0NTQ2NTA1NzYxNjAzMjM5NDA1NjY0NTQ3MTU1NTk0OTE4NjczOTI0MDI4NzM2NzMzNjQ3MzIxNjI3NTExMTMwMDQzOTMxODE3MTE4NDI3ODA0Mzk3MjMzNDI5Mjg0MTY1NDQyNDUxMzUyMTk5MDc4ODgxMzIzMDM3OTEzMzY4OTcwNjAzMDk1MTA1NjcwNzAzMjA5MTU4NzcxMTgxMjcyNDAyMzE1NDY2MjA3NDc2NzY1MDE3Mjg0MzQ2MzE4NDIyNTA5OTQ5MTYwNDI3NTI1MTMxMDEyMzI3NDgyNjY1NTQ1NTQ1NDcxMTkzODQwNTA5OTg5NjA5MjE4MzUwMTI1NTM5MTU2MDcyNDg5NDA0OTAzOTE2NjUxMTk0ODAxNTgyMDYzNjE4OTkxNTQxMDQ4NTY4MTQ4MjkyMTQ0Njk0MzUxNjkzMDc3NjI2MDE0MTAwNTQ1MDc1ODEzMDcxNDM3MTI4MjcxOTcxMDI3MjkxNzIyNTU1ODIzNDEyNTkwMTk1ODI5MjYwMTc4MzkxODQ2NDA0MzkwMDQ0MTg1MzYxMzM2ODc4NTI1MjEwNzI3NDM1NTA0NDg0ODQ5OTMxNTk3MzQ5Mjg2NzMyMTQ3MjkyMzM5NTk5MTA4MjI2NDc3Nzg3ODcxNTQ2NTI5MDg1MjU1MjgxNzEwODcyNzk0ODE3MTMyOTQxMTQ3NjU5ODM2NTEzMDM3Njg2MTY3MTU5NDM0NzU2NTMxNjk0MDY5Njg5OTU1MDIzNDI1MDI0MjgzNjIyMTE3MDYiLCJyZWRpcmVjdF91cmkiOiJodHRwOi8vMTAuMTAuODEuODk6ODA4MCIsImNsaWVudF9uYW1lIjoicHJvdG90eXBlIiwiaWF0IjoxNTE2MjM5MDIyfQ.i59VxZaZRpxhsw6f/jr2Ko+crnf/qYmUeAvi1SKxe9dARmmKwSyGeLc7KsAAofKfIkoP9sSdxR/mvXE5qCM/XSoDHoZjn49WxYprrCWlI7CbYnW/FtasbpEpnI6M0AW7vcoFAEty2ePJbKChJw5/AxjBTdN6EVxg2SJOuzm2RkeLJSC5jNm7qY6cFmWE/ZMzlO5vZ+iVtPcoU079Fc5f9v8keIdBwyEZkwv5d/KivCZO223zzPKcE2wXoTlqefqrHbvSkvVKHJe0xeYWdeYcTM6HnHP8IW2covVYL6NYkVq6jwaPGkLO9kimsuBSVgEbKnwN8EexqLc4HGWojTlAOA==";
    BigInteger P = new BigInteger("8f7935d9b9aae9bfabed887acf4951b6f32ec59e3baf3718e8eac4961f3efd3606e74351a9c4183339b809e7c2ae1c539ba7475b85d011adb8b47987754984695cac0e8f14b3360828a22ffa27110a3d62a993453409a0fe696c4658f84bdd20819c3709a01057b195adcd00233dba5484b6291f9d648ef883448677979cec04b434a6ac2e75e9985de23db0292fc1118c9ffa9d8181e7338db792b730d7b9e349592f68099872153915ea3d6b8b4653c633458f803b32a4c2e0f27290256e4e3f8a3b0838a1c450e4e18c1a29a37ddf5ea143de4b66ff04903ed5cf1623e158d487c608e97f211cd81dca23cb6e380765f822e342be484c05763939601cd667",16);
    BigInteger q = new BigInteger("baf696a68578f7dfdee7fa67c977c785ef32b233bae580c0bcd5695d",16);
    BigInteger u = new BigInteger("8515918516694561415648484561456158645613484613348118648451684148645154815184151816156489486156184586413311848445151845121846654846123156486");

    BigInteger g = new BigInteger("16a65c58204850704e7502a39757040d34da3a3478c154d4e4a5c02d242ee04f96e61e4bd0904abdac8f37eeb1e09f3182d23c9043cb642f88004160edf9ca09b32076a79c32a627f2473e91879ba2c4e744bd2081544cb55b802c368d1fa83ed489e94e0fa0688e32428a5c78c478c68d0527b71c9a3abb0b0be12c44689639e7d3ce74db101a65aa2b87f64c6826db3ec72f4b5599834bb4edb02f7c90e9a496d3a55d535bebfc45d4f619f63f3dedbb873925c2f224e07731296da887ec1e4748f87efb5fdeb75484316b2232dee553ddaf02112b0d1f02da30973224fe27aeda8b9d4b2922d9ba8be39ed9e103a63c52810bc688b7e2ed4316e1ef17dbde",16);
    BigInteger basic_client_id = g;//new BigInteger("4041426645612503873277003983038666454650576160323940566454715559491867392402873673364732162751113004393181711842780439723342928416544245135219907888132303791336897060309510567070320915877118127240231546620747676501728434631842250994916042752513101232748266554554547119384050998960921835012553915607248940490391665119480158206361899154104856814829214469435169307762601410054507581307143712827197102729172255582341259019582926017839184640439004418536133687852521072743550448484993159734928673214729233959910822647778787154652908525528171087279481713294114765983651303768616715943475653169406968995502342502428362211706");
    RecluseToken recluseToken;
    public Recluse(){
    }
    private BigInteger generateSK() {
        BigInteger sk = new BigInteger("2").pow(2047);
        SecureRandom r = new SecureRandom();
        for(int i=0;i<256;i++){
            if(r.nextBoolean()){
                sk = sk.setBit(i);
            }
        }
        return sk;
    }
    private String generateID() {
        SecureRandom r = new SecureRandom();
        String ID = "";
        for(int i=0; i<24;i++){
            ID = ID + r.nextInt(10);
        }
        return ID;
    }


    class NegotiationResponseBody{
        String Cert;
    }
    public String buildNegotiationResponse(HttpServletResponse response){
        BigInteger sk = generateSK();
        BigInteger pk = g.modPow(sk, P);
        DHKey dhKey = new DHKey();
        String ID;
        do {
            ID = generateID();
            dhKey.setID(ID);
        }while (DHKeyManager.hasID(ID));
        dhKey.setG(g.toString());
        dhKey.setPk_server(pk.toString());
        dhKey.setBasic_client_id(basic_client_id.toString());
        dhKey.setRPCert(RPCert);
        Gson gson = new Gson();
        NegotiationResponseBody body = new NegotiationResponseBody();
        body.Cert = RPCert;
        String responseBody = gson.toJson(body);
        dhKey.setSK_server(sk.toString());
        DHKeyManager.put(dhKey.getID(), dhKey);
        Cookie cookie = new Cookie("cookie", ID);
        response.addCookie(cookie);
        response.setHeader("Access-Control-Allow-Origin", "*");
        return responseBody;

    }
    public void receiveToken(HttpServletRequest request, String body) {
        String ID = null;
        Cookie[] cookies = request.getCookies();
        for (int i = 0; i < cookies.length; i++) {
            if (cookies[i].getName().equals("cookie")) {
                ID = cookies[i].getValue();
            }
        }
        String id_token = body;
        DHKey dhKey = (DHKey) DHKeyManager.getByName(ID);
        DecodedJWT token = decodeToken(id_token);
        recluseToken = new RecluseToken();
        if(token != null) {
            if(token.getAudience().contains(dhKey.getClient_id())){
                recluseToken.setValid(true);
            }else {
                recluseToken.setValid(false);
            }
            BigInteger temp[] = ExtendEculid(new BigInteger(dhKey.getSk_client()), q);
            BigInteger _result = temp[1];
            BigInteger sub = new BigInteger(token.getSubject());
            BigInteger userIdentity = sub.modPow(_result, P);
            recluseToken.init(token, userIdentity.toString());
        }else {
            recluseToken.setValid(false);
        }
    }
    public BigInteger[] ExtendEculid(BigInteger a, BigInteger b)
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
    DecodedJWT decodeToken(String token){
        String estr = Util.bytes2HexString(Base64.getUrlDecoder().decode(e));//getDecoder().decode(e).toString();
        String nstr = Util.bytes2HexString(Base64.getUrlDecoder().decode(n));
        RSAPublicKeySpec keySpec = new RSAPublicKeySpec(new BigInteger(nstr, 16), new BigInteger(estr, 16));
        try {
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            RSAPublicKey publicKey = (RSAPublicKey) keyFactory.generatePublic(keySpec);
            Algorithm algorithm = Algorithm.RSA256(publicKey, null);
            JWTVerifier verifier = JWT.require(algorithm)
                    .build(); //Reusable verifier instance
            DecodedJWT jwt = verifier.verify(token);
            return jwt;
        } catch (JWTVerificationException exception){
            //Invalid signature/claims
            return null;
        } catch (NoSuchAlgorithmException e1) {
            e1.printStackTrace();
            return null;
        } catch (InvalidKeySpecException e1) {
            e1.printStackTrace();
            return null;
        }
    }
    public RecluseToken getToken() {
        return recluseToken;
    }
}
