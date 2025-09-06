package io.lukerykta.service;

import io.lukerykta.entity.Role;
import io.lukerykta.entity.User;
import io.lukerykta.entity.UserRole;
import io.lukerykta.repository.RoleRepository;
import io.lukerykta.repository.UserRepository;
import io.lukerykta.repository.UserRoleRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@Service
@Transactional
@AllArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository users;
    private final RoleRepository roles;
    private final UserRoleRepository userRoles;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest req) throws OAuth2AuthenticationException {
        OAuth2User oauth = super.loadUser(req);

        // Normalize provider id & attributes
        String provider = req.getClientRegistration().getRegistrationId();
        String providerId = Optional.ofNullable(oauth.getAttribute("sub"))
            .or(() -> Optional.ofNullable(oauth.getAttribute("id")))
            .map(Object::toString)
            .orElseThrow(() -> new IllegalStateException(
                "OAuth2 user is missing both 'sub' (Google) and 'id' (GitHub) attributes"));

        String email = attr(oauth, "email");
        String name  = attr(oauth, "name");      // GitHub: may be null; consider "login"
        if (name == null) name = attr(oauth, "login");
        String avatar = firstNonNull(attr(oauth, "picture"), attr(oauth, "avatar_url"));

        // --- upsert User ---
        User user = users.findByProviderAndProviderId(provider, providerId)
            .orElseGet(() -> new User(provider, providerId)); // requires that convenience ctor

        if (email != null)       user.setEmail(email);
        if (name != null)        user.setDisplayName(name);
        if (avatar != null)      user.setAvatarUrl(avatar);
        user.setActive(true);

        user = users.save(user);
        log.info("Upserted user id={} provider={} roles={}", user.getId(), provider, user.getUserRoles());

        // --- ensure default role ---
        Role authRole = roles.findByName("AUTHENTICATED_VISITOR")
            .orElseThrow(() -> new IllegalStateException("Missing seed role AUTHENTICATED_VISITOR"));
        if (!userRoles.existsByUserIdAndRoleId(user.getId(), authRole.getId())) {
            userRoles.save(new UserRole(user, authRole));
        }

        // --- map DB roles -> authorities ---
        List<SimpleGrantedAuthority> authorities = users.findRoleNames(user.getId()).stream()
            .map(rn -> new SimpleGrantedAuthority("ROLE_" + rn))
            .toList();

        // --- expose attributes to the app (plus our DB user id) ---
        Map<String, Object> attrs = new HashMap<>(oauth.getAttributes());
        attrs.put("appUserId", user.getId());

        // Choose the correct "name attribute key" for DefaultOAuth2User
        // Google has "sub"; GitHub has "id" -- prefer Google's "sub" if present; else "id".
        String nameAttributeKey = attrs.containsKey("sub") ? "sub" : "id";

        return new DefaultOAuth2User(authorities, attrs, nameAttributeKey);
    }

    @SuppressWarnings("unchecked")
    private static <T> T attr(OAuth2User user, String key) {
        return (T) user.getAttributes().get(key);
    }

    private static String firstNonNull(String a, String b) {
        return a != null ? a : b;
    }
}
