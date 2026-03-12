package io.lukerykta.repository;

import io.lukerykta.dto.AdminPopularRouteDto;
import io.lukerykta.entity.PageViewEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface PageViewEventRepository extends JpaRepository<PageViewEvent, Long> {

    @Query("""
        select count(v)
        from PageViewEvent v
        where v.viewedAt >= :start and v.viewedAt < :end
    """)
    long countBetween(@Param("start") Instant start, @Param("end") Instant end);

    @Query("""
        select new io.lukerykta.dto.AdminPopularRouteDto(
            v.routePath,
            count(v),
            count(distinct v.visitorId),
            max(v.viewedAt)
        )
        from PageViewEvent v
        group by v.routePath
        order by count(v) desc, max(v.viewedAt) desc, v.routePath asc
    """)
    List<AdminPopularRouteDto> findTopRoutes(Pageable pageable);
}
