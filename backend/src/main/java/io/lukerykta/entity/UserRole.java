package io.lukerykta.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
@Slf4j
@Table(
    name = "user_roles",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_role", columnNames = {"user_id", "role_id"})
    },
    indexes = {
        @Index(name = "idx_user_roles_user", columnList = "user_id"),
        @Index(name = "idx_user_roles_role", columnList = "role_id")
    }
)
public class UserRole {

    public UserRole(User user, Role role) { this.user = user; this.role = role; }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // surrogate key

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_ur_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_ur_role"))
    private Role role;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt;

    @PrePersist
    void onCreate() {
        String roleName = role != null ? role.getName() : null;
        Long userId = user != null ? user.getId() : null;
        log.debug("Persisting user-role link user={} role={}", userId, roleName);
    }

    @PreRemove
    void onRemove() {
        String roleName = role != null ? role.getName() : null;
        Long userId = user != null ? user.getId() : null;
        log.debug("Removing user-role link user={} role={}", userId, roleName);
    }
    
}
