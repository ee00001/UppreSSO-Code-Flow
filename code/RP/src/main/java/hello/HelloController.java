package hello;
import com.google.gson.Gson;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import sdk.*;
import sdk.Bean.UserInfo;
import sdk.Bean.UserManager;

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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class HelloController {
    private static final Logger logger = LoggerFactory.getLogger(HelloController.class);

    private static final String ATTR_SSO_START_NS = "rp_sso_start_ns";

    Recluse recluse = new Recluse();
    private static final String SESSION_VERIFIER_KEY = "pkce_verifier";

    @RequestMapping("/")
    public String index() {
        return "index";
    }

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    private static final Map<String, String> tStore = new ConcurrentHashMap<>();

    @RequestMapping(value = "/getT", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Object getT(HttpSession session, @RequestParam(value = "flow", required = false) String flow){
        long startNs = System.nanoTime();
        session.setAttribute(ATTR_SSO_START_NS, startNs);
        logger.info("RP_SSO_START sid={} startNs={}", session.getId(), startNs);

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
            logger.error("getT error sid={}", session.getId(), e);
            return null;
        }
    }

    @RequestMapping(value = "/authorization", method = RequestMethod.POST)
    @ResponseBody
    public String authorization(@RequestBody String body, HttpServletRequest request) {
        // time test
        long verifyStartNs;

        HttpSession session = request.getSession(false);
        String sid = (session != null) ? session.getId() : "no-session";

        // time test
        Long startNsObj = (session != null)
                ? (Long) session.getAttribute(ATTR_SSO_START_NS)
                : null;

        Gson gson = new Gson();
        JsonObject jsonObj = gson.fromJson(body, JsonObject.class);
        String tokenStr;

        // IdP域名
        String IdPDomain = "http://localhost:8080";

        try {
            String flow = "implicit";


            // 授权码流
            if (jsonObj.has("code")) {
                flow = "code";
                String code = jsonObj.get("code").getAsString();


                // PKCE verifier
                String verifier = (String) request.getSession()
                        .getAttribute(SESSION_VERIFIER_KEY);
                if (verifier == null) {
                    logger.warn("authorization: missing PKCE verifier sid={}", sid);
                    return "{\"result\":\"error\"}";
                }
                request.getSession().removeAttribute(SESSION_VERIFIER_KEY);

                TokenExchangeResult exchangeResult = AuthorizationCodeExchange.exchangeCodeForToken(
                        code, IdPDomain, verifier);

                verifyStartNs = exchangeResult.getDeserializeNs();

                Map<String, String> resp = exchangeResult.getBody();

                tokenStr = resp.get("id_token");
                if (tokenStr == null) {
                    logger.warn("authorization: no id_token in response sid={}", sid);
                    return "{\"result\":\"error\"}";
                }
            } else {

                verifyStartNs = System.nanoTime();

                // 隐式流：直接取 id_token
                tokenStr = jsonObj.get("id_token").getAsString();
            }



            String t = (session != null) ? tStore.remove(session.getId()) : null;
            if (t == null) {
                logger.warn("authorization: missing t sid={}", sid);
                return "{\"result\":\"error\"}";
            }

            // 验证token有效性，提取用户身份
            recluse.receiveToken(tokenStr, t);
            RecluseToken token = recluse.getToken();

            if (!token.isValid()) {
                long endNs = System.nanoTime();
                long verifyMs = (endNs - verifyStartNs) / 1_000_000L;

                logger.warn("RP_TOKEN_VERIFY_LOGIN_TIME ms={} flow={} sid={} result=invalid_token",
                        verifyMs, flow, sid);

                return "{\"result\":\"error\"}";
            }

            String subject = token.getSubject();
            UserInfo localUserInfo = UserManager.getUserByID(token.getSubject());
            String resultJson;
            String resultLabel;

            if (localUserInfo != null) {
                resultJson = "{\"result\":\"ok\"}";
                resultLabel = "ok";
            } else {
                UserInfo user = new UserInfo();
                user.setID(token.getSubject());
                UserManager.setUser(user);
                resultJson = "{\"result\":\"register\"}";
                resultLabel = "register";
            }

            long endNs = System.nanoTime();
            long verifyMs = (endNs - verifyStartNs) / 1_000_000L;

            logger.info(
                    "RP_TOKEN_VERIFY_LOGIN_TIME ms={} flow={} sid={} subject={} result={}",
                    verifyMs,
                    flow,
                    sid,
                    subject,
                    resultLabel
            );

            if (startNsObj != null) {
                long totalMs = (endNs - startNsObj) / 1_000_000L;
                logger.info(
                        "RP_TOTAL_LOGIN_TIME ms={} flow={} sid={} subject={} result={}",
                        totalMs,
                        flow,
                        sid,
                        subject,
                        resultLabel
                );
                session.removeAttribute(ATTR_SSO_START_NS);
            }

            return resultJson;
        } catch (Exception e) {
            logger.error("authorization error sid={}", sid, e);
            return "{\"result\":\"error\"}";
        }
    }
}