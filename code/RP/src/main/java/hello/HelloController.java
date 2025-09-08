package hello;
import com.google.gson.Gson;
import org.springframework.boot.web.servlet.server.Session;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ConcurrentModel;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import sdk.Bean.UserInfo;
import sdk.Bean.UserManager;
import sdk.Recluse;
import sdk.RecluseToken;
import sdk.AuthorizationCodeExchange;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;


//新增依赖
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
    @RequestMapping("/")
    public String index(Model model) {
        System.out.println("/index");
        return "index";
    }

    // 确保在类加载时添加 Bouncy Castle 提供者
    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    //新增：t由RP在会话中生成，而不是由用户的IdP脚本生成
    private static final Map<String, String> tStore = new ConcurrentHashMap<>();
    @RequestMapping(value = "/getT", method = RequestMethod.GET)
    @ResponseBody
    public String getT(HttpSession session){
        System.out.println("/getT");
        System.out.println("Session ID: " + session.getId());
        //根据IdP脚本处的t生成逻辑对应修改
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

        // 授权码流
        if (jsonObj.has("code")) {
            String code = jsonObj.get("code").getAsString();

            //IdP域名
            String IdPDomain = "http://localhost:8080";

            Map<String, String> resp = AuthorizationCodeExchange.exchangeCodeForToken(
                    code, IdPDomain);
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

    }
}