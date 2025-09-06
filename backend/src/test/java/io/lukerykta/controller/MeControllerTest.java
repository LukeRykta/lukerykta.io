package io.lukerykta.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.client.OAuth2ClientAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientWebSecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MeController.class)
@ImportAutoConfiguration(exclude = {
    OAuth2ClientAutoConfiguration.class,
    OAuth2ClientWebSecurityAutoConfiguration.class
})
class MeControllerTest {

    @Autowired MockMvc mvc;

    // Minimal chain, no oauth2Login(), avoids pulling client beans
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
    void me_returns401_when_unauthenticated() throws Exception {
        mvc.perform(get("/api/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.error").value("not_authenticated"));
    }

    @Test
    void me_returns_dto_for_google_user() throws Exception {
        var token = googleToken();
        mvc.perform(get("/api/me").with(authentication(token)))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(42))
            .andExpect(jsonPath("$.email").value("test@example.com"))
            .andExpect(jsonPath("$.displayName").value("Test User"))
            .andExpect(jsonPath("$.avatarUrl").value("https://example.com/a.png"))
            .andExpect(jsonPath("$.provider").value("google"))
            .andExpect(jsonPath("$.providerId").value("google-sub-123"))
            .andExpect(jsonPath("$.roles[0]").value("AUTHENTICATED_VISITOR"))
            .andExpect(jsonPath("$.roles[1]").value("ADMIN"))
            .andExpect(jsonPath("$.authenticated").value(true));
    }

    @Test
    void me_returns_dto_for_github_user() throws Exception {
        var attrs = Map.<String,Object>of(
            "appUserId", 7L,
            "id", "gh-999",
            "login", "octocat",
            "email", "octo@example.com",
            "avatar_url", "https://avatars.githubusercontent.com/u/1"
        );
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_AUTHENTICATED_VISITOR"));
        var principal = new DefaultOAuth2User(authorities, attrs, "id");
        var token = new OAuth2AuthenticationToken(principal, authorities, "github");

        mvc.perform(get("/api/me").with(authentication(token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.provider").value("github"))
            .andExpect(jsonPath("$.providerId").value("gh-999"))
            .andExpect(jsonPath("$.displayName").value("octocat"));
    }

    private static OAuth2AuthenticationToken googleToken() {
        var attrs = Map.<String,Object>of(
            "appUserId", 42L,
            "sub", "google-sub-123",
            "email", "test@example.com",
            "name", "Test User",
            "picture", "https://example.com/a.png"
        );
        var authorities = List.of(
            new SimpleGrantedAuthority("ROLE_AUTHENTICATED_VISITOR"),
            new SimpleGrantedAuthority("ROLE_ADMIN")
        );
        var principal = new DefaultOAuth2User(authorities, attrs, "sub");
        return new OAuth2AuthenticationToken(principal, authorities, "google");
    }
}
