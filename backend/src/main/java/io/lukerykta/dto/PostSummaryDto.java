package io.lukerykta.dto;

import io.lukerykta.entity.PostType;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class PostSummaryDto {
    Long id;
    PostType type;
    String title;
    String content;
    String previewImageUrl;
    String externalUrl;
    int likeCount;
    Instant createdAt;
}
