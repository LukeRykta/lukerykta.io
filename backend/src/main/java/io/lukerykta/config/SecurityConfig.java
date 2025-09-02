package io.lukerykta.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class SecurityConfig {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/error",
                    "/public/**",
                    "/oauth2/**",
                    "/actuator/**",
                    "/health"
                )
                .permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )

            .oauth2Login(oauth -> oauth
                .successHandler((req, res, auth) -> {
                    res.sendRedirect(frontendUrl + "/");
                })
                .failureHandler((req, res, ex) -> res.sendRedirect(frontendUrl + "/"))
            )

            .logout(l -> l.logoutSuccessUrl(frontendUrl + "/"));

        http.cors(cors -> {});

        return http.build();
    }
}
