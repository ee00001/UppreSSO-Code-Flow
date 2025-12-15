package time;

import java.io.IOException;
import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class IdPCode4TokenProcessFilter implements Filter {

	private static final Logger logger = LoggerFactory.getLogger(IdPCode4TokenProcessFilter.class);


	@Override
	public void init(FilterConfig filterConfig) throws ServletException {
		logger.info("IdPCode4TokenProcessFilter init");
	}

	@Override
	public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
		HttpServletRequest request = (HttpServletRequest) req;

		String method = request.getMethod();
		String ctype  = request.getContentType();


		if (!"POST".equalsIgnoreCase(method)) {
			chain.doFilter(request, res);
			return;
		}

		if (ctype == null || !ctype.toLowerCase().startsWith("message/ohttp-req")) {
			chain.doFilter(request, res);
			return;
		}

		long startNs = System.nanoTime();
		try {
			chain.doFilter(request, res);
		} finally {
			long endNs = System.nanoTime();
			long ms = (endNs - startNs) / 1_000_000L;

			logger.info("IDP_PHASE2_GATEWAY_TIME ms={}", ms);
		}
	}

	@Override
	public void destroy() {
		// no-op
	}
}
