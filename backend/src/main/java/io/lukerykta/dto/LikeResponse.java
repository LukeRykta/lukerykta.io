package io.lukerykta.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LikeResponse {
    Long postId;
    int likeCount;
}
