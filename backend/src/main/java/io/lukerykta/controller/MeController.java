package io.lukerykta.controller;

import io.lukerykta.dto.MeResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MeController {

    @GetMapping("/me")
    public ResponseEntity<?> me(
        @AuthenticationPrincipal OAuth2User user,
        Authentication auth
    ) {
        if (user == null || auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "not_authenticated"));
        }

        Map<String, Object> a = user.getAttributes();
        Long appUserId = a.get("appUserId") instanceof Number n ? n.longValue() : null;

        // Provider detection
        String providerId = a.containsKey("sub") ? String.valueOf(a.get("sub"))
            : a.containsKey("id") ? String.valueOf(a.get("id"))
            : null;
        String provider = a.containsKey("sub") ? "google"
            : a.containsKey("id") ? "github"
            : null;

        String email = (String) a.get("email");
        String displayName = (String) a.getOrDefault("name", a.getOrDefault("login", null));
        String avatarUrl = (String) a.getOrDefault("picture", a.getOrDefault("avatar_url", null));

        // Authorities → roles
        List<String> roles = auth.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .filter(s -> s.startsWith("ROLE_"))
            .map(s -> s.substring(5))
            .toList();

        return ResponseEntity.ok(new MeResponse(
            appUserId,
            email,
            displayName,
            avatarUrl,
            provider,
            providerId,
            roles,
            true
        ));
    }
}
