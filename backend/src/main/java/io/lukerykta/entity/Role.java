package io.lukerykta.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@EqualsAndHashCode
@Slf4j
@Table(
    name = "roles",
    uniqueConstraints = { @UniqueConstraint(name = "uq_role_name", columnNames = "name") }
)
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 64, nullable = false)
    private String name;            // e.g., "AUTHENTICATED_VISITOR", "ADMIN"

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<UserRole> userRoles = new HashSet<>();

    @PrePersist
    void onCreate() {
        log.debug("Creating role {}", name);
    }

    @PreUpdate
    void onUpdate() {
        log.debug("Updating role id={} name={}", id, name);
    }

}
