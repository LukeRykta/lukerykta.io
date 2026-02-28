package io.lukerykta.config;

import java.net.URI;
import java.util.List;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Slf4j
@Configuration
@EnableConfigurationProperties(AppCorsProperties.class)
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
        AppCorsProperties corsProperties,
        @Value("${app.frontend.url:http://localhost:4200}") String frontendUrl) {
        List<String> origins = corsProperties.allowedOrigins() == null ? List.of() : corsProperties.allowedOrigins()
            .stream()
            .map(origin -> origin == null ? "" : origin.replaceAll("/+$", ""))
            .filter(origin -> !origin.isBlank())
            .distinct()
            .toList();

        if (origins.isEmpty()) {
            String fallbackOrigin = frontendUrl == null ? "" : frontendUrl.replaceAll("/+$", "");
            if (fallbackOrigin.isBlank()) {
                throw new IllegalStateException(
                    "CORS origins are empty; configure app.cors.allowed-origins or app.frontend.url");
            }
            origins = List.of(fallbackOrigin);
            log.warn("Using fallback CORS origin from app.frontend.url; prefer app.cors.allowed-origins");
        }

        for (String origin : origins) {
            URI parsedOrigin = URI.create(origin);
            if (parsedOrigin.getScheme() == null || parsedOrigin.getHost() == null) {
                throw new IllegalStateException("Invalid CORS origin (scheme/host required): " + origin);
            }
        }

        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(origins); // exact scheme://host[:port]
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization", "Location"));
        cfg.setAllowCredentials(true); // needed if you use cookies/Authorization across origins

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);

        log.info("CORS allowed origins: {}", origins);
        log.debug("CORS allowed methods: {}", cfg.getAllowedMethods());
        log.debug("CORS allowed headers: {}", cfg.getAllowedHeaders());
        log.debug("CORS exposed headers: {}", cfg.getExposedHeaders());

        return source;
    }
}

