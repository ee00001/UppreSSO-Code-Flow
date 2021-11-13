package hello;
import org.springframework.boot.web.servlet.server.Session;
import org.springframework.web.bind.annotation.RequestBody;
import sdk.Bean.UserInfo;
import sdk.Bean.UserManager;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import sdk.Recluse;
import sdk.RecluseToken;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.Date;

@RestController
public class HelloController {
    Recluse recluse = new Recluse();
    long start;
    long end;
    long average = 0;
    long count = 0;
    @RequestMapping("/")
    public String index() {
        return "this is a index";
    }
    @RequestMapping("/login")
    public String login(HttpServletRequest request, HttpSession session, HttpServletResponse response) {
        System.out.println("/login");
        Cookie cookie = new Cookie("cookie", "123456");

        start = new Date().getTime();
        String responseBody = recluse.buildNegotiationResponse(response);
        return responseBody;
    }


    @RequestMapping(value = "/authorization", method = RequestMethod.POST)
    public String authorization(@RequestBody String body, HttpServletRequest request, HttpSession session, HttpServletResponse response){
        System.out.println("/authorization");
        long t1 = new Date().getTime();
        recluse.receiveToken(request, body);
        RecluseToken token = recluse.getToken();
        if(token.isValid()) {
            System.out.println(token.getSubject());
            UserInfo localUserInfo = UserManager.getUserByID(token.getSubject());
            if (localUserInfo != null) {
                long t2 = new Date().getTime();
//                average = (average * count + end - start)/(++count) ;
//                count ++ ;
                System.out.println(t2-t1);
                return "{\"result\":\"ok\"}";
            } else {
                UserInfo user = new UserInfo();
                user.setID(token.getSubject());
                UserManager.setUser(user);
                return "{\"result\":\"register\"}";
            }
        }
        return "{\"result\":\"error\"}";
    }


}