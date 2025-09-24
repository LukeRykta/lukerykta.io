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
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
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
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository users;
    private final RoleRepository roles;
    private final UserRoleRepository userRoles;

    private final DefaultOAuth2UserService oauthDelegate = new DefaultOAuth2UserService();
    private final OidcUserService oidcDelegate = new OidcUserService();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest req) throws OAuth2AuthenticationException {
        OAuth2User oauth = oauthDelegate.loadUser(req);
        UserDetails details = process(req.getClientRegistration().getRegistrationId(), oauth);
        return new DefaultOAuth2User(details.authorities(), details.attributes(), details.nameAttributeKey());
    }

    public OidcUser loadOidcUser(OidcUserRequest req) throws OAuth2AuthenticationException {
        OidcUser oidc = oidcDelegate.loadUser(req);
        UserDetails details = process(req.getClientRegistration().getRegistrationId(), oidc);
        return new DefaultOidcUser(details.authorities(), req.getIdToken(), new OidcUserInfo(details.attributes()), details.nameAttributeKey());
    }

    private UserDetails process(String provider, OAuth2User oauth) {
        String providerId = Optional.ofNullable(oauth.getAttribute("sub"))
            .or(() -> Optional.ofNullable(oauth.getAttribute("id")))
            .map(Object::toString)
            .orElseThrow(() -> new IllegalStateException(
                "OAuth2 user is missing both 'sub' (Google) and 'id' (GitHub) attributes"));

        log.debug("OAuth2 login for provider={} providerId={}", provider, providerId);

        String email = attr(oauth, "email");
        String name  = attr(oauth, "name");
        if (name == null) name = attr(oauth, "login");
        String avatar = firstNonNull(attr(oauth, "picture"), attr(oauth, "avatar_url"));

        if (email == null) {
            log.warn("OAuth2 provider {} did not supply email for providerId {}", provider, providerId);
        }
        if (name == null) {
            log.warn("OAuth2 provider {} did not supply name for providerId {}", provider, providerId);
        }

        User user;
        try {
            user = users.findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> new User(provider, providerId));

            if (email != null)  user.setEmail(email);
            if (name != null)   user.setDisplayName(name);
            if (avatar != null) user.setAvatarUrl(avatar);
            user.setActive(true);

            user = users.save(user);

            Role authRole = roles.findByName("AUTHENTICATED_VISITOR")
                .orElseThrow(() -> new IllegalStateException("Missing seed role AUTHENTICATED_VISITOR"));

            userRoles.saveIfNotExists(new UserRole(user, authRole));
        } catch (RuntimeException e) {
            log.error("Database error upserting user provider={} providerId={}", provider, providerId, e);
            throw e;
        }

        List<String> roleNames = users.findRoleNames(user.getId());

        log.info("Upserted user id={} provider={} roles={}", user.getId(), provider, roleNames);

        List<SimpleGrantedAuthority> authorities = roleNames.stream()
            .map(rn -> new SimpleGrantedAuthority("ROLE_" + rn))
            .toList();

        Map<String, Object> attrs = new HashMap<>(oauth.getAttributes());
        attrs.put("appUserId", user.getId());

        String nameAttributeKey = attrs.containsKey("sub") ? "sub" : "id";

        return new UserDetails(authorities, attrs, nameAttributeKey);
    }

    @SuppressWarnings("unchecked")
    private static <T> T attr(OAuth2User user, String key) {
        return (T) user.getAttributes().get(key);
    }

    private static String firstNonNull(String a, String b) {
        return a != null ? a : b;
    }

    private record UserDetails(List<SimpleGrantedAuthority> authorities,
                               Map<String, Object> attributes,
                               String nameAttributeKey) {}
}
