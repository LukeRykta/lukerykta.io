package io.lukerykta.controller;

import io.lukerykta.service.PageViewService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.client.OAuth2ClientAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientWebSecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.BDDMockito.then;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@ImportAutoConfiguration(exclude = {
    OAuth2ClientAutoConfiguration.class,
    OAuth2ClientWebSecurityAutoConfiguration.class
})
class AnalyticsControllerTest {

    @Autowired MockMvc mvc;

    @MockitoBean PageViewService pageViews;

    @TestConfiguration
    static class SecurityTestConfig {
        @Bean
        SecurityFilterChain testChain(HttpSecurity http) throws Exception {
            http.authorizeHttpRequests(a -> a.anyRequest().permitAll())
                .csrf(AbstractHttpConfigurer::disable);
            return http.build();
        }
    }

    @Test
    void recordPageView_accepts_anonymous_requests() throws Exception {
        mvc.perform(post("/api/public/analytics/page-views")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "routePath": "/about?ref=nav",
                      "visitorId": "visitor-123"
                    }
                    """))
            .andExpect(status().isAccepted());

        then(pageViews).should().recordPageView("/about?ref=nav", "visitor-123", null);
    }

    @Test
    void recordPageView_includes_authenticated_user_id_when_present() throws Exception {
        var attrs = Map.<String, Object>of(
            "appUserId", 42L,
            "sub", "google-sub-123"
        );
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_AUTHENTICATED_VISITOR"));
        var principal = new DefaultOAuth2User(authorities, attrs, "sub");
        var token = new OAuth2AuthenticationToken(principal, authorities, "google");

        mvc.perform(post("/api/public/analytics/page-views")
                .with(authentication(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "routePath": "/projects",
                      "visitorId": "visitor-456"
                    }
                    """))
            .andExpect(status().isAccepted());

        then(pageViews).should().recordPageView("/projects", "visitor-456", 42L);
    }
}
