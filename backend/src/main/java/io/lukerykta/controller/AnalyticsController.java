package io.lukerykta.controller;

import io.lukerykta.dto.PageViewRequest;
import io.lukerykta.service.PageViewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public/analytics")
public class AnalyticsController {

    private final PageViewService pageViews;

    @PostMapping("/page-views")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void recordPageView(
        @RequestBody PageViewRequest request,
        @AuthenticationPrincipal OAuth2User user
    ) {
        Long userId = appUserIdOrNull(user);
        log.debug("Page view routePath={} userId={}", request.routePath(), userId);
        pageViews.recordPageView(request.routePath(), request.visitorId(), userId);
    }

    private Long appUserIdOrNull(OAuth2User user) {
        if (user == null) {
            return null;
        }
        Object value = user.getAttributes().get("appUserId");
        return value instanceof Number n ? n.longValue() : null;
    }
}
