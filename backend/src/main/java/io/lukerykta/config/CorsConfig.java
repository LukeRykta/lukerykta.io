package io.lukerykta.config;

import java.net.URI;
import java.util.List;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Slf4j
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

        if (origin.isBlank()) {
            log.error("CORS origin is empty; check app.frontend.url");
        } else {
            try {
                URI.create(origin);
            } catch (IllegalArgumentException ex) {
                log.error("Invalid CORS origin: {}", origin, ex);
            }
        }

        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(origin)); // exact scheme://host[:port]
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization", "Location"));
        cfg.setAllowCredentials(true); // needed if you use cookies/Authorization across origins

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);

        log.info("CORS allowed origin: {}", origin);
        log.debug("CORS allowed methods: {}", cfg.getAllowedMethods());
        log.debug("CORS allowed headers: {}", cfg.getAllowedHeaders());
        log.debug("CORS exposed headers: {}", cfg.getExposedHeaders());

        if ("http://localhost:4200".equals(origin)) {
            log.warn("Using default CORS origin; verify deployment settings.");
        }

        return source;
    }
}

