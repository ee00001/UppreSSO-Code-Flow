package sdk;

import com.google.gson.Gson;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import sdk.ohttp.OHttpClient;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class AuthorizationCodeExchange {

    //与IdP建立连接，TODO：更换为匿名网络，
    private static RestTemplate connectToIdP(String idpDomain) {
        return new RestTemplate();
    }

    public static Map<String, String> exchangeCodeForToken(
            String code, String idpDomain, String verifier) {
        RestTemplate client = connectToIdP(idpDomain);

        String tokenEndpoint = idpDomain + "/openid-connect-server-webapp" + "/code4token";

        System.out.println("[AuthorizationCodeExchange] POST → " + tokenEndpoint);

        Map<String, String> form = new HashMap<>();
        form.put("grant_type", "authorization_code");
        form.put("code", code);
        form.put("client_id", "anonymous");
        form.put("client_secret", "public");
        //PKCE verifier
        form.put("code_verifier", verifier);

        //签名逻辑，暂时未签名，直接放行
        String formString = form.toString(); // 或自定义序列化
        String signed = AnonymousSignatureModule.sign(formString);

        // OHTTP 连接
        try {
            OHttpClient ohttp = new OHttpClient();          // 复用已有实现
            Map<String, String> resp = ohttp.postForm(tokenEndpoint, form, null);

            return resp;
        } catch (Exception e) {
            throw new RuntimeException("OHTTP token exchange failed", e);
        }


// 原始 HTTP 连接
//        HttpHeaders headers = new HttpHeaders();
//        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
//
//        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);
//
//        ResponseEntity<Map> resp = client.postForEntity(tokenEndpoint, entity, Map.class);
//
//        return (Map<String, String>) resp.getBody();
    }
}