package io.lukerykta.service;

import io.lukerykta.dto.AdminOverviewDto;
import io.lukerykta.dto.AdminPopularRouteDto;
import io.lukerykta.dto.AdminUserPageDto;
import io.lukerykta.repository.PageViewEventRepository;
import io.lukerykta.entity.PostType;
import io.lukerykta.repository.PostRepository;
import io.lukerykta.repository.UserRepository;
import io.lukerykta.repository.UserVisitEventRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminDashboardServiceTest {

    @Test
    void overview_counts_visits_for_day_month_and_year() {
        UserRepository users = mock(UserRepository.class);
        PostRepository posts = mock(PostRepository.class);
        UserVisitEventRepository visits = mock(UserVisitEventRepository.class);
        PageViewEventRepository pageViews = mock(PageViewEventRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-03-11T16:30:00Z"), ZoneOffset.UTC);

        Instant dayStart = Instant.parse("2026-03-11T00:00:00Z");
        Instant dayEnd = Instant.parse("2026-03-12T00:00:00Z");
        Instant monthStart = Instant.parse("2026-03-01T00:00:00Z");
        Instant monthEnd = Instant.parse("2026-04-01T00:00:00Z");
        Instant yearStart = Instant.parse("2026-01-01T00:00:00Z");
        Instant yearEnd = Instant.parse("2027-01-01T00:00:00Z");

        when(users.count()).thenReturn(12L);
        when(visits.count()).thenReturn(63L);
        when(visits.countBetween(dayStart, dayEnd)).thenReturn(4L);
        when(visits.countBetween(monthStart, monthEnd)).thenReturn(28L);
        when(visits.countBetween(yearStart, yearEnd)).thenReturn(63L);
        when(posts.countByType(PostType.PROJECT)).thenReturn(6L);
        when(posts.sumLikeCount()).thenReturn(41L);
        when(pageViews.findTopRoutes(org.mockito.ArgumentMatchers.any(Pageable.class))).thenReturn(List.of(
            new AdminPopularRouteDto("/", 18L, 12L, Instant.parse("2026-03-11T16:21:00Z")),
            new AdminPopularRouteDto("/projects", 11L, 7L, Instant.parse("2026-03-11T15:10:00Z"))
        ));

        AdminDashboardService service = new AdminDashboardService(users, posts, visits, pageViews, clock);

        AdminOverviewDto overview = service.getOverview();

        assertEquals(12L, overview.totalUsers());
        assertEquals(63L, overview.totalVisits());
        assertEquals(4L, overview.visitsToday());
        assertEquals(28L, overview.visitsThisMonth());
        assertEquals(63L, overview.visitsThisYear());
        assertEquals(6L, overview.totalProjects());
        assertEquals(41L, overview.totalLikes());
        assertEquals(2, overview.topRoutes().size());
        assertEquals("/", overview.topRoutes().getFirst().routePath());
    }

    @Test
    void users_supports_visits_sorting() {
        UserRepository users = mock(UserRepository.class);
        PostRepository posts = mock(PostRepository.class);
        UserVisitEventRepository visits = mock(UserVisitEventRepository.class);
        PageViewEventRepository pageViews = mock(PageViewEventRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-03-11T16:30:00Z"), ZoneOffset.UTC);

        when(users.findAdminUserRows(org.mockito.ArgumentMatchers.any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of()));

        AdminDashboardService service = new AdminDashboardService(users, posts, visits, pageViews, clock);

        AdminUserPageDto page = service.getUsers(0, 10, "visits", "desc");
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(users).findAdminUserRows(pageableCaptor.capture());

        Pageable pageable = pageableCaptor.getValue();

        assertEquals("visits", page.sortBy());
        assertEquals("desc", page.direction());
        assertTrue(pageable.getSort().stream().anyMatch(order ->
            order.getProperty().contains("count(v)") && order.isDescending()
        ));
    }
}
