package io.lukerykta.repository;

import io.lukerykta.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    // Check if a user already has a role
    boolean existsByUserIdAndRoleId(Long userId, Long roleId);

    // Find all roles for a user (as join entities)
    // List<UserRole> findByUserId(Long userId);

    // Remove a role assignment
    // void deleteByUserIdAndRoleId(Long userId, Long roleId);

    // Find all users with a given role
    // List<UserRole> findByRoleId(Long roleId);
}
