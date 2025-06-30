/*******************************************************************************
 * Copyright 2018 The MIT Internet Trust Consortium
 *
 * Portions copyright 2011-2013 The MITRE Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/
package org.mitre.openid.connect.web;

import java.util.Map;

import org.mitre.openid.connect.service.StatsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;

/**
 * @author Michael Jett <mjett@mitre.org>
 */

@Controller
public class RootController {

	public static final String API_URL = "api";
	
	private static final Logger logger = LoggerFactory.getLogger(RootController.class);

	@Autowired
	private StatsService statsService;

	@RequestMapping({"", "home", "index", "index111"})
	public String showHomePage(ModelMap m) {
		int i = 0;
		i++;
		if(i==0)
			return null;
		return "home";
	}
	

	@RequestMapping({"about", "about/"})
	public String showAboutPage(ModelMap m) {
		return "about";
	}

	@RequestMapping({"stats", "stats/"})
	public String showStatsPage(ModelMap m) {
		Map<String, Integer> summary = statsService.getSummaryStats();

		m.put("statsSummary", summary);
		return "stats";
	}

	@RequestMapping({"contact", "contact/"})
	public String showContactPage(ModelMap m) {
		return "contact";
	}

	@PreAuthorize("hasRole('ROLE_USER')")
	@RequestMapping("manage/**")
	public String showClientManager(ModelMap m) {
		return "manage";
	}

	public StatsService getStatsService() {
		return statsService;
	}

	public void setStatsService(StatsService statsService) {
		this.statsService = statsService;
	}


	@RequestMapping({"script"})
	public String getScript(ModelMap m, HttpServletRequest request){
		return "script";
	}

	@RequestMapping({"isAuthenticated"})
	@ResponseBody
	public String checkAuthenticated (ModelMap m, Authentication authentication) {
		if (authentication == null) {
			logger.debug("No authentication object found, returning false");
			return "{\"authenticated\": false}";
		} else {
			return "{\"authenticated\": "+ authentication.isAuthenticated() +"}";
		}
	}

	@RequestMapping({"post_token"})
	public String getTokenScript(ModelMap m, HttpServletRequest request){
		return "postTokenScript";
	}

}
