package io.lukerykta.dto;

import java.util.List;

public record AdminUserPageDto(
    List<AdminUserRowDto> items,
    int page,
    int size,
    long totalElements,
    int totalPages,
    String sortBy,
    String direction,
    boolean hasNext,
    boolean hasPrevious
) {
}
