package sdk;

import com.google.gson.Gson;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
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

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("client_id", "anonymous");
        form.add("client_secret", "public");
        //PKCE verifier
        form.add("code_verifier", verifier);

        //签名逻辑，暂时未签名，直接放行
        String formString = form.toString(); // 或自定义序列化
        String signed = AnonymousSignatureModule.sign(formString);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);

        ResponseEntity<Map> resp = client.postForEntity(tokenEndpoint, entity, Map.class);

        return (Map<String, String>) resp.getBody();
    }
}