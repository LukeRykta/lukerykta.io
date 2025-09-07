package io.lukerykta.config;

import io.lukerykta.service.CustomOAuth2UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Slf4j
@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        log.info("Configuring API security filter chain");
        http.securityMatcher("/api/**")
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> {
                log.warn("Unauthorized request to {}", req.getRequestURI());
                res.sendError(HttpStatus.UNAUTHORIZED.value());
            }))  // no HTML redirects
            .oauth2Login(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable);
        return http.build();
    }

    @Bean
    public SecurityFilterChain app(HttpSecurity http, CustomOAuth2UserService custom) throws Exception {
        log.info("Configuring APP security filter chain");
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/assets/**",
                    "/favicon.ico",
                    "/oauth/**",
                    "/logout"
                )
                .permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(o -> o
                .loginPage(frontendUrl + "/oauth") // Angular login page
                .userInfoEndpoint(u -> u
                    .userService(custom)
                    .oidcUserService(custom::loadOidcUser))
                .successHandler((req, res, auth) -> {
                    String redirect = Optional.ofNullable(req.getParameter("redirect")).orElse("/");
                    log.debug("OAuth2 login success for user={}, redirect={}", auth.getName(), redirect);
                    res.sendRedirect(frontendUrl + "/oauth/done?redirect=" +
                        URLEncoder.encode(redirect, StandardCharsets.UTF_8));
                })
            )
            .logout(l -> l
                    .logoutUrl("/logout")
                    .invalidateHttpSession(true)
                    .clearAuthentication(true)
                    .deleteCookies("JSESSIONID")
                .logoutSuccessHandler((req, res, auth) -> {
                    log.info("User {} logged out", auth != null ? auth.getName() : "anonymous");
                    new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)
                        .onLogoutSuccess(req, res, auth);
                })
            );
        return http.build();
    }
}
