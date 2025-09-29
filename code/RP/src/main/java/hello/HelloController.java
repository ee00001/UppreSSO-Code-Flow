package hello;
import com.google.gson.Gson;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ConcurrentModel;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import sdk.Bean.UserInfo;
import sdk.Bean.UserManager;
import sdk.PkceUtil;
import sdk.Recluse;
import sdk.RecluseToken;
import sdk.AuthorizationCodeExchange;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.spec.ECParameterSpec;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.jce.interfaces.ECPrivateKey;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;

import com.google.gson.JsonObject;



@Controller
public class HelloController {
    Recluse recluse = new Recluse();
    private static final String SESSION_VERIFIER_KEY = "pkce_verifier";

    @RequestMapping("/")
    public String index(Model model) {
        System.out.println("/index");
        return "index";
    }

    // 确保在类加载时添加 Bouncy Castle 提供者
    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    private static final Map<String, String> tStore = new ConcurrentHashMap<>();

    @RequestMapping(value = "/getT", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Object getT(HttpSession session, @RequestParam(value = "flow", required = false) String flow){
        System.out.println("/getT");
        System.out.println("Session ID: " + session.getId());
        try {
            // 生成椭圆曲线密钥对
            ECParameterSpec ecSpec = ECNamedCurveTable.getParameterSpec("secp256k1");
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("EC", "BC");
            keyPairGenerator.initialize(ecSpec);
            KeyPair keyPair = keyPairGenerator.generateKeyPair();

            // 从私钥中提取 t
            ECPrivateKey privateKey = (ECPrivateKey) keyPair.getPrivate();
            String t = privateKey.getD().toString(10);

            tStore.put(session.getId(), t);

            // 授权码流生成 PKCE
            if ("code".equals(flow)) {
                String verifier = PkceUtil.generateVerifier();
                String challenge = PkceUtil.challenge(verifier);
                session.setAttribute(SESSION_VERIFIER_KEY, verifier);

                Map<String,String> ans = new HashMap<>();
                ans.put("t", t);
                ans.put("challenge", challenge);
                ans.put("method", "S256");
                return ans;
            }

            return t;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @RequestMapping(value = "/authorization", method = RequestMethod.POST)
    @ResponseBody
    public String authorization(@RequestBody String body, HttpServletRequest request) {
        System.out.println("/authorization");
        String t = tStore.remove(request.getSession().getId());
        if (t == null)
            return "{\"result\":\"error\"}";

        Gson gson = new Gson();
        JsonObject jsonObj = gson.fromJson(body, JsonObject.class);
        String tokenStr;

        try {
            // 授权码流
            if (jsonObj.has("code")) {
                String code = jsonObj.get("code").getAsString();

                // IdP域名
                String IdPDomain = "http://localhost:8080";

                // PKCE verifier
                String verifier = (String) request.getSession()
                        .getAttribute(SESSION_VERIFIER_KEY);
                if (verifier == null) return "{\"result\":\"error\"}";
                request.getSession().removeAttribute(SESSION_VERIFIER_KEY);


                Map<String, String> resp = AuthorizationCodeExchange.exchangeCodeForToken(
                        code, IdPDomain, verifier);
                tokenStr = resp.get("id_token");
                if (tokenStr == null) return "{\"result\":\"error\"}";
            } else {
                // 隐式流：直接取 id_token
                tokenStr = jsonObj.get("id_token").getAsString();
            }

            //验证token有效性，提取用户身份
            recluse.receiveToken(tokenStr, t);
            RecluseToken token = recluse.getToken();

            if (!token.isValid()) return "{\"result\":\"error\"}";

            System.out.println("Token is valid, subject: " + token.getSubject());
            UserInfo localUserInfo = UserManager.getUserByID(token.getSubject());
            if (localUserInfo != null) {
                return "{\"result\":\"ok\"}";
            } else {
                UserInfo user = new UserInfo();
                user.setID(token.getSubject());
                UserManager.setUser(user);
                return "{\"result\":\"register\"}";
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "{\"result\":\"error\"}";
        }
    }
}