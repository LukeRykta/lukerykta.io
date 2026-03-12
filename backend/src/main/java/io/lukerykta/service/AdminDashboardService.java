package io.lukerykta.service;

import io.lukerykta.dto.AdminUserPageDto;
import io.lukerykta.dto.AdminOverviewDto;
import io.lukerykta.dto.AdminPopularRouteDto;
import io.lukerykta.dto.AdminUserRowDto;
import io.lukerykta.entity.PostType;
import io.lukerykta.repository.PageViewEventRepository;
import io.lukerykta.repository.PostRepository;
import io.lukerykta.repository.UserRepository;
import io.lukerykta.repository.UserVisitEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 50;
    private static final int TOP_ROUTE_LIMIT = 5;

    private final UserRepository users;
    private final PostRepository posts;
    private final UserVisitEventRepository visits;
    private final PageViewEventRepository pageViews;
    private final Clock clock;

    public AdminOverviewDto getOverview() {
        long totalUsers = users.count();
        long totalVisits = visits.count();
        long visitsToday = countVisitsForWindow(Window.DAY);
        long visitsThisMonth = countVisitsForWindow(Window.MONTH);
        long visitsThisYear = countVisitsForWindow(Window.YEAR);
        long totalProjects = posts.countByType(PostType.PROJECT);
        long totalLikes = posts.sumLikeCount();
        java.util.List<AdminPopularRouteDto> topRoutes = pageViews.findTopRoutes(PageRequest.of(0, TOP_ROUTE_LIMIT));

        return new AdminOverviewDto(
            totalUsers,
            totalVisits,
            visitsToday,
            visitsThisMonth,
            visitsThisYear,
            totalProjects,
            totalLikes,
            topRoutes
        );
    }

    public AdminUserPageDto getUsers(int page, int size, String sortBy, String direction) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = size <= 0
            ? DEFAULT_PAGE_SIZE
            : Math.clamp(size, 5, MAX_PAGE_SIZE);
        String normalizedSort = normalizeSort(sortBy);
        Sort.Direction normalizedDirection = normalizeDirection(direction);

        PageRequest pageable = PageRequest.of(
            normalizedPage,
            normalizedSize,
            buildSort(normalizedSort, normalizedDirection)
        );

        Page<AdminUserRowDto> result = users.findAdminUserRows(pageable);

        return new AdminUserPageDto(
            result.getContent(),
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages(),
            normalizedSort,
            normalizedDirection.name().toLowerCase(Locale.ROOT),
            result.hasNext(),
            result.hasPrevious()
        );
    }

    private String normalizeSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return "lastSeen";
        }

        return switch (sortBy) {
            case "name", "email", "provider", "visits", "firstLogin", "lastSeen" -> sortBy;
            default -> "lastSeen";
        };
    }

    private Sort.Direction normalizeDirection(String direction) {
        return "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
    }

    private Sort buildSort(String sortBy, Sort.Direction direction) {
        if ("visits".equals(sortBy)) {
            return JpaSort.unsafe(direction, "(select count(v) from UserVisitEvent v where v.user = u)")
                .and(Sort.by(Sort.Direction.DESC, "id"));
        }

        String property = switch (sortBy) {
            case "name" -> "displayName";
            case "email" -> "email";
            case "provider" -> "provider";
            case "firstLogin" -> "createdAt";
            case "lastSeen" -> "lastAuthAt";
            default -> "lastAuthAt";
        };

        return Sort.by(
            new Sort.Order(direction, property),
            new Sort.Order(Sort.Direction.DESC, "id")
        );
    }

    private long countVisitsForWindow(Window window) {
        LocalDate todayUtc = clock.instant().atZone(ZoneOffset.UTC).toLocalDate();
        Instant start = switch (window) {
            case DAY -> todayUtc.atStartOfDay(ZoneOffset.UTC).toInstant();
            case MONTH -> todayUtc.withDayOfMonth(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            case YEAR -> todayUtc.withDayOfYear(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        };
        Instant end = switch (window) {
            case DAY -> todayUtc.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            case MONTH -> todayUtc.withDayOfMonth(1).plusMonths(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            case YEAR -> todayUtc.withDayOfYear(1).plusYears(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        };

        return visits.countBetween(start, end);
    }

    private enum Window {
        DAY,
        MONTH,
        YEAR
    }
}
