package sdk;

import com.google.gson.JsonObject;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.digest.DigestUtils;
import sdk.Bean.*;
import com.google.gson.Gson;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.math.BigInteger;
import java.security.*;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPrivateKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.List;

@RestController
public class RecluseController  {
    BigInteger P = new BigInteger("8f7935d9b9aae9bfabed887acf4951b6f32ec59e3baf3718e8eac4961f3efd3606e74351a9c4183339b809e7c2ae1c539ba7475b85d011adb8b47987754984695cac0e8f14b3360828a22ffa27110a3d62a993453409a0fe696c4658f84bdd20819c3709a01057b195adcd00233dba5484b6291f9d648ef883448677979cec04b434a6ac2e75e9985de23db0292fc1118c9ffa9d8181e7338db792b730d7b9e349592f68099872153915ea3d6b8b4653c633458f803b32a4c2e0f27290256e4e3f8a3b0838a1c450e4e18c1a29a37ddf5ea143de4b66ff04903ed5cf1623e158d487c608e97f211cd81dca23cb6e380765f822e342be484c05763939601cd667",16);
    BigInteger q = new BigInteger("baf696a68578f7dfdee7fa67c977c785ef32b233bae580c0bcd5695d",16);
    BigInteger g = new BigInteger("16a65c58204850704e7502a39757040d34da3a3478c154d4e4a5c02d242ee04f96e61e4bd0904abdac8f37eeb1e09f3182d23c9043cb642f88004160edf9ca09b32076a79c32a627f2473e91879ba2c4e744bd2081544cb55b802c368d1fa83ed489e94e0fa0688e32428a5c78c478c68d0527b71c9a3abb0b0be12c44689639e7d3ce74db101a65aa2b87f64c6826db3ec72f4b5599834bb4edb02f7c90e9a496d3a55d535bebfc45d4f619f63f3dedbb873925c2f224e07731296da887ec1e4748f87efb5fdeb75484316b2232dee553ddaf02112b0d1f02da30973224fe27aeda8b9d4b2922d9ba8be39ed9e103a63c52810bc688b7e2ed4316e1ef17dbde",16);
    BigInteger basic_client_id = g;//new BigInteger("4041426645612503873277003983038666454650576160323940566454715559491867392402873673364732162751113004393181711842780439723342928416544245135219907888132303791336897060309510567070320915877118127240231546620747676501728434631842250994916042752513101232748266554554547119384050998960921835012553915607248940490391665119480158206361899154104856814829214469435169307762601410054507581307143712827197102729172255582341259019582926017839184640439004418536133687852521072743550448484993159734928673214729233959910822647778787154652908525528171087279481713294114765983651303768616715943475653169406968995502342502428362211706");
    String redirect_uri = "http://192.168.0.190:8090/authorization";
    String RPCert = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1ZXIiOiJodHRwOi8vMTAuMTAuODEuNDI6ODA4MCIsImJhc2ljX2NsaWVudF9pZCI6IjQwNDE0MjY2NDU2MTI1MDM4NzMyNzcwMDM5ODMwMzg2NjY0NTQ2NTA1NzYxNjAzMjM5NDA1NjY0NTQ3MTU1NTk0OTE4NjczOTI0MDI4NzM2NzMzNjQ3MzIxNjI3NTExMTMwMDQzOTMxODE3MTE4NDI3ODA0Mzk3MjMzNDI5Mjg0MTY1NDQyNDUxMzUyMTk5MDc4ODgxMzIzMDM3OTEzMzY4OTcwNjAzMDk1MTA1NjcwNzAzMjA5MTU4NzcxMTgxMjcyNDAyMzE1NDY2MjA3NDc2NzY1MDE3Mjg0MzQ2MzE4NDIyNTA5OTQ5MTYwNDI3NTI1MTMxMDEyMzI3NDgyNjY1NTQ1NTQ1NDcxMTkzODQwNTA5OTg5NjA5MjE4MzUwMTI1NTM5MTU2MDcyNDg5NDA0OTAzOTE2NjUxMTk0ODAxNTgyMDYzNjE4OTkxNTQxMDQ4NTY4MTQ4MjkyMTQ0Njk0MzUxNjkzMDc3NjI2MDE0MTAwNTQ1MDc1ODEzMDcxNDM3MTI4MjcxOTcxMDI3MjkxNzIyNTU1ODIzNDEyNTkwMTk1ODI5MjYwMTc4MzkxODQ2NDA0MzkwMDQ0MTg1MzYxMzM2ODc4NTI1MjEwNzI3NDM1NTA0NDg0ODQ5OTMxNTk3MzQ5Mjg2NzMyMTQ3MjkyMzM5NTk5MTA4MjI2NDc3Nzg3ODcxNTQ2NTI5MDg1MjU1MjgxNzEwODcyNzk0ODE3MTMyOTQxMTQ3NjU5ODM2NTEzMDM3Njg2MTY3MTU5NDM0NzU2NTMxNjk0MDY5Njg5OTU1MDIzNDI1MDI0MjgzNjIyMTE3MDYiLCJyZWRpcmVjdF91cmkiOiJodHRwOi8vMTAuMTAuODEuODk6ODA4MCIsImNsaWVudF9uYW1lIjoicHJvdG90eXBlIiwiaWF0IjoxNTE2MjM5MDIyfQ.i59VxZaZRpxhsw6f/jr2Ko+crnf/qYmUeAvi1SKxe9dARmmKwSyGeLc7KsAAofKfIkoP9sSdxR/mvXE5qCM/XSoDHoZjn49WxYprrCWlI7CbYnW/FtasbpEpnI6M0AW7vcoFAEty2ePJbKChJw5/AxjBTdN6EVxg2SJOuzm2RkeLJSC5jNm7qY6cFmWE/ZMzlO5vZ+iVtPcoU079Fc5f9v8keIdBwyEZkwv5d/KivCZO223zzPKcE2wXoTlqefqrHbvSkvVKHJe0xeYWdeYcTM6HnHP8IW2covVYL6NYkVq6jwaPGkLO9kimsuBSVgEbKnwN8EexqLc4HGWojTlAOA==";

    String privateKeyString = "MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCVagNIzL0xjLUpzROBhuWWoR8nvbew5+SulaOpGl2B+3Y3S2Nfg6aazMEqTehqUwOfOL94WUslQAibux5qoF0nKycraT5/N2w6Y4Dmuy+2A24vuPQhGiI9MHgmFKVIAjNCvL9Z1iEiaNsx79ZeWjPJF3B1HzFLBkVClEOorzc9wxoEQqoW/yTJRCZkE8DBGxRwNcF7zEKFXAFKjXMihw7gK2y5q9G8a0fdJO1r48ZkfEUd0xbYA6vKtEvq8fPzehpcaldc0snrFelHhS7Jb/qYZBoBrDKRRQuhcR5IZZNUT+o8qV6e3Zk+/u7QPjISfj65DAFeZPZ8AH85IKb94mQdAgMBAAECggEASGq9dMdm22ErXTs8PQc4t60YAJb/NQrv135HeGqC78EFJv+vBlg0o8qhxPNFtmLN2poSky4UMdW7Vl92+o8HFzjfHzc/R0GBfztC+pG3Kiy3dwHZsUGNXsLjOPHAugn29l2tEMmr/ZV8x9NKvyhQ+SIXK20W4xoC76YUtOlXiOMMrKe3qJBVHZnSY2hGxBCMgSkpeB83bosBc5jn/4d5PSXF5GOuKIdTroELnPzfSFVLmC2/9lf8nurvB2NAqqZ/iU9EISsND+okr/8jq1SXH2J6nCRTVm7eJgMkxqwb9tGRMlKcZ5ITfwoBUOFUPg3GxeDE8sHRz/MdJYN6Nsa6MQKBgQDVG6V7oRgqeKIxyKpBdByQrvHIwVy2W/iiLVwjsLrk3kbFe2Y5P/UytVlQoX5UaGpFAzLRnVcVBvoRL7QHlVfs8knQHAbSp0u3vEE5m74aNCcl4QEpLrUxtE7kVPV8+vXwZSUpN4kKJ1xU58Os7va7IvomlaediWqsr8If0qRuFwKBgQCzfIzFGvWqKAWJuqEGgM5IS3SQn0k4bRFb1khlVJgojTuS8sIkTLSGhVftJJf1qolQGzIMZK4tSp0ioY/viz2omLhjh7n1kIWmtgOdJkcumb1nrcgFyM1jcgofTtMh9phKmSuQprCSsaexINdS0hScq4L0QXreXYrqzntiC4tz6wKBgA2z52IZq6ofc55r3raytpt/BED6XfHD3Crha8lHtdy9hiNwmdQYjrWh/4o1uB/JTvv9Bql/ynepqS6tuI+8RJkRwzlEdBPbefzod/EyWHjq3ZGL9D0nqbL2exQnell88Y9xkYAi+AbVHRTAik52VxsVVqxgdxSkH13XN05Ahx4lAoGAYyK6BexcID22wVnpstPWHCxBF9hC8v2bBuSWXBGbcVqAuyuGe9I6K8rew8bgf/pPmYVL4XiCk9WQcR5Xh/GaftLLlX3UAoRuraP+3v/TdTPJX8imoDtG5lSIrr40859mgl2TqHPJN10UyErhY4dRhy9cR1kbalK0dfjSQVcrET0CgYADsiOiiikulzwYoombhU4kITZSxCIuHkTdEbQqOm9CSaJUZVHmdT9YZ1ggCe7r6Kb8ieru7X+RZVuze472SAszNiS6hXE45KNRv1fBbxM5Nu3McGruk8YexfdWcotBSL2vxAZPRTtnuR54ndozcOOwsAS+lzZpfMCJXP9eExw5BQ==";

    String publicKeyString = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlWoDSMy9MYy1Kc0TgYbllqEfJ723sOfkrpWjqRpdgft2N0tjX4OmmszBKk3oalMDnzi/eFlLJUAIm7seaqBdJysnK2k+fzdsOmOA5rsvtgNuL7j0IRoiPTB4JhSlSAIzQry/WdYhImjbMe/WXlozyRdwdR8xSwZFQpRDqK83PcMaBEKqFv8kyUQmZBPAwRsUcDXBe8xChVwBSo1zIocO4CtsuavRvGtH3STta+PGZHxFHdMW2AOryrRL6vHz83oaXGpXXNLJ6xXpR4UuyW/6mGQaAawykUULoXEeSGWTVE/qPKlent2ZPv7u0D4yEn4+uQwBXmT2fAB/OSCm/eJkHQIDAQAB";



    public boolean verify(byte[]content, byte[] signed){
        X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(Base64.decodeBase64(publicKeyString.getBytes()));
        KeyFactory kf = null;
        try {
            kf = KeyFactory.getInstance("RSA");
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        try {
            Signature Sign = Signature.getInstance("SHA256withRSA");
            RSAPublicKey pubk = (RSAPublicKey) kf.generatePublic(publicKeySpec);
            Sign.initVerify(pubk);
            Sign.update(content);
            boolean verify = Sign.verify(signed);
            return verify;
        } catch (InvalidKeySpecException e) {
            e.printStackTrace();
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (SignatureException e) {
            e.printStackTrace();
        } catch (InvalidKeyException e) {
            e.printStackTrace();
        }
        return false;
    }


    @RequestMapping(value = "/redir", method = RequestMethod.GET)
    public ModelAndView redir(){
        return new ModelAndView("redirect:http://192.168.0.190:8080/openid-connect-server-webapp/script");
    }

    class UploadPKBody{
        String N_U;
    }
    @RequestMapping(value = "/uploadPK", method = RequestMethod.POST)
    public String uploadPK(@RequestBody String body, HttpServletRequest request, HttpSession session, HttpServletResponse response){
        System.out.println("/uploadPK");
        Gson gson = new Gson();
        String ID = "123456";
        UploadPKBody upbody = gson.fromJson(body, UploadPKBody.class);
        String N_U = upbody.N_U;
        DHKey dhKey = new DHKey();
        BigInteger sk = new BigInteger(N_U);
        BigInteger PID_RP = basic_client_id.modPow(sk, P);
        dhKey.setSk_client(N_U);
        dhKey.setClient_id(PID_RP.toString());
        Cookie cookie = new Cookie("cookie", ID);
        response.addCookie(cookie);
        DHKeyManager.put(ID, dhKey);
        return "{\"result\":\"ok\", \"Cert_RP\": \""+RPCert+"\"}";
    }

    class RegistrationRes{
        class RegistrationInfo{
            String client_id;
            List redirect_uris;
            String client_id_issued_at;

        }
        class Content{
            String Result;
            RegistrationInfo RegistrationInfo;
        }
//        Content Content;
        String Sig;
        String Content;
    }
    class Content{
        String Result;
        RegistrationRes.RegistrationInfo RegistrationInfo;
        class RegistrationInfo{
            String client_id;
            List redirect_uris;
            String client_id_issued_at;

        }
    }


    @RequestMapping(value = "/register_finished", method = RequestMethod.POST)
    public String register_finished(@RequestBody String body, HttpServletRequest request, HttpSession session, HttpServletResponse response){
        System.out.println("/register_finished");
        Gson gson = new Gson();
        RegistrationRes registrationInfo = gson.fromJson(body, RegistrationRes.class);
        response.setHeader("Access-Control-Allow-Origin", "*");
        if(verify(registrationInfo.Content.getBytes(), Base64.decodeBase64(registrationInfo.Sig))) {
            Content content = gson.fromJson(new String(Base64.decodeBase64(registrationInfo.Content)), Content.class);
            if (content.Result.equals("OK")) {
                String ID = null;
                Cookie[] cookies = request.getCookies();
                for (int i = 0; i < cookies.length; i++) {
                    if (cookies[i].getName().equals("cookie")) {
                        ID = cookies[i].getValue();
                    }
                }
                DHKey dhKey = (DHKey) DHKeyManager.getByName(ID);
                String N_U = dhKey.getSk_client();
                String client_id = dhKey.getClient_id();
                if (client_id.equals(content.RegistrationInfo.client_id)) {
                    String hashN_U = DigestUtils.sha256Hex(N_U);
                    String uri = (String) content.RegistrationInfo.redirect_uris.get(0);
                    String[] parts = uri.split("/");
                    String tempHashN_U = parts[parts.length - 1];
                    if (hashN_U.equals(tempHashN_U)) {
                        return "{\"client_id\":\"" + client_id + "\", \"redirect_uri\": \"" + redirect_uri + "\", \"response_type\":\"token\", \"scope\":\"openid%20email\"}";
                    }
                }

            }
        }
//        if(registrationResult.isResultOK()){
//            DHKey dhKey = (DHKey)DHKeyManager.getByName(registrationResult.getID());
//            if(registrationResult.getClient_id().equals(dhKey.getClient_id())){
//                return new ModelAndView("redirect:http://10.10.81.42:8080/openid-connect-server-webapp/authorize?client_id=" + registrationResult.getClient_id() + "&redirect_uri=" + registrationResult.getRedirect_uri() + "&response_type=token&scope=openid%20email");
//            }else {
//                return null;
//            }
//        }else {
            return null;
//        }
    }

    @RequestMapping(value = "/end", method = RequestMethod.GET)
    public String end( HttpServletRequest request, HttpSession session, HttpServletResponse response){
        response.setHeader("Access-Control-Allow-Origin", "*");
//        end = new Date().getTime();
//        count++;
//
//
//        System.out.println("Negotiation: " + (point1 + point3 - point2 - start));
//        System.out.println("NegotiationTotal : : " + (point3 - start));



//
//        long negotiation = point3 - start;
//        long registration = point5 - point3;
//        long tokenObtaining = point7 - point5;
//        long total1 = negotiation + registration + tokenObtaining;
//        totalNegotiation += negotiation;
//        totalRegistration += registration;
//        totalTokenObtaining += tokenObtaining;
//        long totalTotal = totalNegotiation + totalRegistration + totalTokenObtaining;
//        System.out.println(count);
//        System.out.println("negotiation: " + totalNegotiation/count + "ms");
//        System.out.println("registration: " + totalRegistration/count + "ms");
//        System.out.println("tokenObtaining: " + totalTokenObtaining/count + "ms");
//        System.out.println("total: " + totalTotal/count + "ms");
        return "end";
    }



}
