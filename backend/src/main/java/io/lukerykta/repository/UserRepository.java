package io.lukerykta.repository;

import io.lukerykta.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Logger log = LoggerFactory.getLogger(UserRepository.class);

    default Optional<User> findByProviderAndProviderId(String provider, String providerId) {
        Optional<User> user = findUserByProviderAndProviderId(provider, providerId);
        if (user.isEmpty()) {
            log.info("No user found for provider={} providerId={}, assuming first-time login", provider, providerId);
        }
        return user;
    }

    @Query("select u from User u where u.provider = :provider and u.providerId = :providerId")
    Optional<User> findUserByProviderAndProviderId(@Param("provider") String provider,
                                                   @Param("providerId") String providerId);

    /** Find a user by email, warning if missing. */
    Optional<User> findByEmail(String email);

    default List<String> findRoleNames(Long userId) {
        List<String> roles = findRoleNamesInternal(userId);
        log.debug("Loaded roles {} for userId={}", roles, userId);
        return roles;
    }

    @Query("""
        select r.name
        from UserRole ur
          join ur.role r
        where ur.user.id = :userId
    """)
    List<String> findRoleNamesInternal(@Param("userId") Long userId);
}
