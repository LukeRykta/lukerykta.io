package io.lukerykta.controller;

import io.lukerykta.dto.LikeResponse;
import io.lukerykta.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/public/posts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class LikeController {

    private final PostService postService;

    @PostMapping("/{postId}/like")
    public LikeResponse like(@PathVariable Long postId) {
        log.debug("Like requested for post={} ", postId);
        int count = postService.incrementLike(postId);
        return LikeResponse.builder()
            .postId(postId)
            .likeCount(count)
            .build();
    }

    @PostMapping("/{postId}/unlike")
    public LikeResponse unlike(@PathVariable Long postId) {
        log.debug("Unlike requested for post={} ", postId);
        int count = postService.decrementLike(postId);
        return LikeResponse.builder()
            .postId(postId)
            .likeCount(count)
            .build();
    }
}
