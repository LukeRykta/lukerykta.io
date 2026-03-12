package io.lukerykta.controller;

import io.lukerykta.dto.LikeResponse;
import io.lukerykta.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class LikeController {

    private final PostService postService;

    @PostMapping("/{postId}/likes")
    public LikeResponse like(
        @PathVariable Long postId,
        @AuthenticationPrincipal OAuth2User user
    ) {
        Long userId = requireAppUserId(user);
        log.debug("Like requested for post={} by user={}", postId, userId);
        PostService.LikeMutationResult result = postService.likePost(postId, userId);
        return LikeResponse.builder()
            .postId(postId)
            .likeCount(result.likeCount())
            .likedByCurrentUser(result.likedByCurrentUser())
            .build();
    }

    @DeleteMapping("/{postId}/likes")
    public LikeResponse unlike(
        @PathVariable Long postId,
        @AuthenticationPrincipal OAuth2User user
    ) {
        Long userId = requireAppUserId(user);
        log.debug("Unlike requested for post={} by user={}", postId, userId);
        PostService.LikeMutationResult result = postService.unlikePost(postId, userId);
        return LikeResponse.builder()
            .postId(postId)
            .likeCount(result.likeCount())
            .likedByCurrentUser(result.likedByCurrentUser())
            .build();
    }

    private Long requireAppUserId(OAuth2User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        Object appUserId = user.getAttributes().get("appUserId");
        if (appUserId instanceof Number n) {
            return n.longValue();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
}
