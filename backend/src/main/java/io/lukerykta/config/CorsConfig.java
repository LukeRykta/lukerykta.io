package io.lukerykta.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    /**
     * Configure frontend origin here or via application.yml/env:
     *
     * application.yml:
     *   app:
     *     frontend:
     *       url: <a href="http://localhost:4200">...</a>
     *
     * In prod, will override with https://lukerykta.io (no trailing slash).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
        @Value("${app.frontend.url:http://localhost:4200}") String frontendUrl) {

        // Normalize: remove any trailing slashes to avoid origin parsing issues
        String origin = frontendUrl.replaceAll("/+$", "");

        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(origin)); // exact scheme://host[:port]
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization", "Location"));
        cfg.setAllowCredentials(true); // needed if you use cookies/Authorization across origins

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}

