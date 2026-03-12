package io.lukerykta.dto;

public record PageViewRequest(
    String routePath,
    String visitorId
) {
}
