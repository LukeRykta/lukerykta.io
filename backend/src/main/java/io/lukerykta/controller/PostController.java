package io.lukerykta.controller;

import io.lukerykta.dto.PostSummaryDto;
import io.lukerykta.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public/posts")
public class PostController {

    private final PostService postService;

    @GetMapping("/projects")
    public List<PostSummaryDto> getProjects(
        @RequestParam(name = "limit", defaultValue = "4") int limit,
        @AuthenticationPrincipal OAuth2User user
    ) {
        Long currentUserId = appUserIdOrNull(user);
        log.debug("Requesting top projects with limit={} userId={}", limit, currentUserId);
        return postService.findTopProjects(limit, currentUserId);
    }

    private Long appUserIdOrNull(OAuth2User user) {
        if (user == null) {
            return null;
        }
        Object value = user.getAttributes().get("appUserId");
        return value instanceof Number n ? n.longValue() : null;
    }
}
