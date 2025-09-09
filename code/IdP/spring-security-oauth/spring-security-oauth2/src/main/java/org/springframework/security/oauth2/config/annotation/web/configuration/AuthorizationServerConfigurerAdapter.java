/*
 * Copyright 2013-2014 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

package org.springframework.security.oauth2.config.annotation.web.configuration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerSecurityConfigurer;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.provider.ClientDetailsService;
import org.springframework.security.oauth2.provider.OAuth2RequestFactory;
import org.springframework.security.oauth2.provider.endpoint.PkceAwareOAuth2RequestFactory;


import javax.servlet.Filter;
import javax.servlet.http.HttpServletRequest;
import java.util.Collections;


/**
 * @author Dave Syer
 *
 */
@Configuration
@EnableAuthorizationServer
public class AuthorizationServerConfigurerAdapter implements AuthorizationServerConfigurer {

	@Autowired
	private ClientDetailsService clientDetailsService;

	@Bean
	public OAuth2RequestFactory pkceRequestFactory() {
		return new PkceAwareOAuth2RequestFactory(clientDetailsService);
	}

	//匿名客户端
	@Override
	public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
		clients.inMemory()
			.withClient("anonymous")
			.secret("public")
			.authorizedGrantTypes("authorization_code")
			.scopes("openid", "email")
			.autoApprove(true);
	}


	@Override
	public void configure(AuthorizationServerSecurityConfigurer security) throws Exception {
		security.tokenEndpointAuthenticationFilters(Collections.<Filter>emptyList());

		security.allowFormAuthenticationForClients();

		security.checkTokenAccess("permitAll()")
			.tokenKeyAccess("permitAll()")
			.passwordEncoder(NoOpPasswordEncoder.getInstance());
	}

	@Bean
	public AuthenticationManager privacyAuthManager() {
		return new AuthenticationManager() {
			@Override
			public Authentication authenticate(Authentication authentication)
				throws org.springframework.security.core.AuthenticationException {
				HttpServletRequest request =
					((org.springframework.web.context.request.ServletRequestAttributes)
						org.springframework.web.context.request.RequestContextHolder
							.getRequestAttributes())
						.getRequest();

				if ("authorization_code".equals(request.getParameter("grant_type"))) {
					return new UsernamePasswordAuthenticationToken(
						authentication.getPrincipal(),
						authentication.getCredentials(),
						Collections.<org.springframework.security.core.GrantedAuthority>emptyList());
				}
				return null;
			}
		};
	}


	@Override
	public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
		endpoints
			.authenticationManager(privacyAuthManager())
			.requestFactory(pkceRequestFactory());
	}
}
