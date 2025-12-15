package hello.time;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;


@RestController
@RequestMapping("/time")
public class RequestTimeController {

    private static final Logger logger = LoggerFactory.getLogger(RequestTimeController.class);

    @PostMapping("/request")
    public void clientTiming(@RequestBody RequestGenerate p,
                             HttpServletRequest request) {

        HttpSession session = request.getSession(false);
        String sid = (session != null) ? session.getId() : "no-session";

        logger.info(
                "RP_REQUEST_GENERATE_TIME ms={} flow={} sid={}",
                p.getMs(),
                p.getFlow(),
                sid
        );
    }
}
