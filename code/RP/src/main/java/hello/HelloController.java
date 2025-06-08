package hello;
import org.springframework.boot.web.servlet.server.Session;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import sdk.Bean.UserInfo;
import sdk.Bean.UserManager;
import sdk.Recluse;
import sdk.RecluseToken;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Date;

@Controller
public class HelloController {
    Recluse recluse = new Recluse();
    @RequestMapping("/")
    public String index(Model model) {
        System.out.println("/index");
        return "index";
    }


    @RequestMapping(value = "/authorization", method = RequestMethod.POST)
    @ResponseBody
    public String authorization(@RequestBody String body, HttpServletRequest request){
        System.out.println("/authorization");
        recluse.receiveToken(request, body);
        RecluseToken token = recluse.getToken();
        if(token.isValid()) {
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
        return "{\"result\":\"error\"}";
    }


}