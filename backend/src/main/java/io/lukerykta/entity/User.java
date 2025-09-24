package io.lukerykta.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode
@Slf4j
@Table(
    name = "users",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_provider_user", columnNames = {"provider", "provider_id"}),
        @UniqueConstraint(name = "uq_email", columnNames = {"email"})
    },
    indexes = {
        @Index(name = "idx_users_email", columnList = "email")
    }
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 32, nullable = false)
    private String provider;                // "google" | "github"

    @Column(name = "provider_id", length = 191, nullable = false)
    private String providerId;              // sub/id from provider

    @Column(length = 320)
    private String email;                   // nullable (GitHub may not provide)

    @Column(name = "display_name", length = 191)
    private String displayName;

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Bidirectional convenience (optional). Avoid eager loading.
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<UserRole> userRoles = new HashSet<>();

    public User(String provider, String providerId) {
        this.provider = provider;
        this.providerId = providerId;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = this.updatedAt = Instant.now();
        log.debug("Creating user provider={} providerId={} email={}", provider, providerId, email);
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
        log.debug("Updating user id={} provider={} providerId={}", id, provider, providerId);
    }

    // Convenience helpers
    public void addRole(Role role) {
        log.debug("Linking role {} to user {}", role.getName(), id);
        UserRole link = new UserRole(this, role);
        if (userRoles.add(link)) {
            role.getUserRoles().add(link);
        }
    }
    public void removeRole(Role role) {
        log.debug("Unlinking role {} from user {}", role.getName(), id);
        userRoles.removeIf(ur -> {
            boolean match = ur.getRole().equals(role);
            if (match) { role.getUserRoles().remove(ur); ur.setUser(null); ur.setRole(null); }
            return match;
        });
    }
}

