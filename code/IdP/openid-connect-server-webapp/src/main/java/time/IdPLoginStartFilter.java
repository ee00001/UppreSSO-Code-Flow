package time;

import java.io.IOException;
import javax.servlet.*;
import javax.servlet.http.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class IdPLoginStartFilter implements Filter {

	private static final Logger logger =
		LoggerFactory.getLogger(IdPLoginStartFilter.class);

	public static final String ATTR_IDP_PHASE1_START_NS = "idp_phase1_start_ns";

	@Override
	public void init(FilterConfig filterConfig) throws ServletException {
		logger.info("== IdPLoginStartFilter init ==");
	}

	@Override
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
		HttpServletRequest  request  = (HttpServletRequest) req;
		HttpServletResponse response = (HttpServletResponse) res;

		String uri    = request.getRequestURI();
		String method = request.getMethod();

		if ("/login".equals(request.getServletPath()) && "POST".equalsIgnoreCase(method)) {
			HttpSession session = request.getSession(true);
			long startNs = System.nanoTime();
			session.setAttribute(ATTR_IDP_PHASE1_START_NS, startNs);

			String sid = (session != null) ? session.getId() : "no-session";
//			logger.info("IDP_PHASE1_START sid={} uri={} startNs={}", sid, uri, startNs);
		}

		// 放行
		chain.doFilter(request, response);
	}

	@Override
	public void destroy() {
		// no-op
	}
}
