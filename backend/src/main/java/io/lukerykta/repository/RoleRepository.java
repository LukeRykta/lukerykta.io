package io.lukerykta.repository;

import io.lukerykta.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Logger log = LoggerFactory.getLogger(RoleRepository.class);

    Optional<Role> findByName(String name);

    /**
     * Lookup a role by name, warning if it is missing.
     *
     * @param name role name to locate
     * @return the matching role, if present
     */
    default Optional<Role> findByNameOrWarn(String name) {
        Optional<Role> role = findByName(name);
        if (role.isEmpty()) {
            log.warn("Role '{}' not found", name);
        }
        return role;
    }
}
