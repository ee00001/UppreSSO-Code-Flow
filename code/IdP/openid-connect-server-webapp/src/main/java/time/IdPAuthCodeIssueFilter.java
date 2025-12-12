package time;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletResponseWrapper;
import javax.servlet.http.HttpSession;
import java.io.IOException;


public class IdPAuthCodeIssueFilter implements Filter {

	private static final Logger logger =
		LoggerFactory.getLogger(IdPAuthCodeIssueFilter.class);

	// 复用前面 Filter 存的 key
	private static final String ATTR_IDP_PHASE1_START_NS =
		IdPLoginStartFilter.ATTR_IDP_PHASE1_START_NS;

	@Override
	public void init(FilterConfig filterConfig) throws ServletException {
		logger.info("== IdPAuthCodeIssueFilter init ==");
	}

	@Override
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {

		HttpServletRequest request  = (HttpServletRequest) req;
		HttpServletResponse response = (HttpServletResponse) res;

		String uri = request.getRequestURI();

		HttpSession session = request.getSession(false);
		final Long startNsObj = (session != null)
			? (Long) session.getAttribute(ATTR_IDP_PHASE1_START_NS)
			: null;
		final String sidForLog = (session != null) ? session.getId() : "no-session";

		HttpServletResponseWrapper wrapped = new HttpServletResponseWrapper(response) {
			@Override
			public void sendRedirect(String location) throws IOException {
				if (startNsObj != null && location != null && location.contains("code=")) {
					long endNs = System.nanoTime();
					long ms    = (endNs - startNsObj) / 1_000_000L;

					logger.info(
						"IDP_PHASE1_CODE_ISSUE_TIME ms={} sid={}  redirectTo={}",
						ms, sidForLog, location
					);

					if (session != null) {
						session.removeAttribute(ATTR_IDP_PHASE1_START_NS);
					}
				}

				super.sendRedirect(location);
			}
		};

		chain.doFilter(request, wrapped);
	}

	@Override
	public void destroy() {
		// no-op
	}
}
