package io.lukerykta.dto;

import java.time.Instant;

public record AdminUserRowDto(
    Long id,
    String avatarUrl,
    String email,
    String displayName,
    String provider,
    Instant firstLoginAt,
    Instant lastSeenAt,
    long visitCount
) {
}
