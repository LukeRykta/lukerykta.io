package io.lukerykta.repository;

import io.lukerykta.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    @Query("""
        select r.name
        from UserRole ur
          join ur.role r
        where ur.user.id = :userId
    """)
    List<String> findRoleNames(@Param("userId") Long userId);
}
