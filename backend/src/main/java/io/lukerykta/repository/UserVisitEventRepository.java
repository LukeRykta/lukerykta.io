package io.lukerykta.repository;

import io.lukerykta.entity.UserVisitEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface UserVisitEventRepository extends JpaRepository<UserVisitEvent, Long> {

    @Query("""
        select count(v)
        from UserVisitEvent v
        where v.visitedAt >= :start and v.visitedAt < :end
    """)
    long countBetween(@Param("start") Instant start, @Param("end") Instant end);
}
