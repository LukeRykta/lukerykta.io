package io.lukerykta.dto;

import java.time.Instant;

public record AdminPopularRouteDto(
    String routePath,
    long viewCount,
    long uniqueVisitorCount,
    Instant lastViewedAt
) {
}
