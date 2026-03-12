package io.lukerykta.dto;

import java.util.List;

public record AdminOverviewDto(
    long totalUsers,
    long totalVisits,
    long visitsToday,
    long visitsThisMonth,
    long visitsThisYear,
    long totalProjects,
    long totalLikes,
    List<AdminPopularRouteDto> topRoutes
) {
}
