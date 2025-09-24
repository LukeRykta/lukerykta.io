package io.lukerykta.repository;

import io.lukerykta.entity.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    Logger log = LoggerFactory.getLogger(UserRoleRepository.class);

    // Check if a user already has a role
    boolean existsByUserIdAndRoleId(Long userId, Long roleId);

    /**
     * Assign a role to a user, logging duplicates and creations.
     *
     * @param userRole entity linking a user to a role
     * @return saved user-role link, or the original if it already existed
     */
    default UserRole saveIfNotExists(UserRole userRole) {
        Long userId = userRole.getUser().getId();
        Long roleId = userRole.getRole().getId();
        if (existsByUserIdAndRoleId(userId, roleId)) {
            log.info("Role '{}' already assigned to user {}", userRole.getRole().getName(), userId);
            return userRole;
        }
        UserRole saved = save(userRole);
        log.info("Assigned role '{}' to user {}", userRole.getRole().getName(), userId);
        return saved;
    }


    // Find all roles for a user (as join entities)
    // List<UserRole> findByUserId(Long userId);

    // Remove a role assignment
    // void deleteByUserIdAndRoleId(Long userId, Long roleId);

    // Find all users with a given role
    // List<UserRole> findByRoleId(Long roleId);
}
