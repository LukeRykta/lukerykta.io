package io.lukerykta.config;

import io.lukerykta.entity.Role;
import io.lukerykta.entity.User;
import io.lukerykta.entity.UserRole;
import io.lukerykta.repository.RoleRepository;
import io.lukerykta.repository.UserRepository;
import io.lukerykta.repository.UserRoleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Grants the ADMIN role to a specific user during application startup.
 * <p>
 * Set the email via the {@code app.bootstrap-admin-email} property or
 * {@code APP_BOOTSTRAP_ADMIN_EMAIL} environment variable. This runner looks up
 * the user by email and assigns the ADMIN role if it isn't already present.
 * The intent is to bootstrap the first admin without manual DB edits.
 * Remove the environment variable after the role has been granted.
 */
@Slf4j
@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private final UserRepository users;
    private final RoleRepository roles;
    private final UserRoleRepository userRoles;
    private final String adminEmail;

    public AdminBootstrapRunner(UserRepository users,
                                RoleRepository roles,
                                UserRoleRepository userRoles,
                                @Value("${app.bootstrap-admin-email:}") String adminEmail) {
        this.users = users;
        this.roles = roles;
        this.userRoles = userRoles;
        this.adminEmail = adminEmail;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank()) {
            return; // nothing to do
        }

        users.findByEmail(adminEmail).ifPresentOrElse(this::grantAdmin,
            () -> log.warn("Bootstrap admin email '{}' not found in users table", adminEmail));
    }

    private void grantAdmin(User user) {
        Role adminRole = roles.findByName("ADMIN")
            .orElseThrow(() -> new IllegalStateException("Missing seed role ADMIN"));
        userRoles.saveIfNotExists(new UserRole(user, adminRole));
        log.info("Granted ADMIN role to {}", adminEmail);
    }
}
