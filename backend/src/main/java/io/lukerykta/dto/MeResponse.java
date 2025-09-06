package io.lukerykta.dto;

import java.util.List;

public record MeResponse(
    Long id,
    String email,
    String displayName,
    String avatarUrl,
    String provider,
    String providerId,
    List<String> roles,
    boolean authenticated
) {}
