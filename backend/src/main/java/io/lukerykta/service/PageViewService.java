package io.lukerykta.service;

import io.lukerykta.entity.PageViewEvent;
import io.lukerykta.entity.User;
import io.lukerykta.repository.PageViewEventRepository;
import io.lukerykta.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PageViewService {

    private static final int MAX_ROUTE_PATH_LENGTH = 255;
    private static final int MAX_VISITOR_ID_LENGTH = 64;

    private final PageViewEventRepository pageViews;
    private final UserRepository users;

    @Transactional
    public void recordPageView(String routePath, String visitorId, Long userId) {
        String normalizedRoutePath = normalizeRoutePath(routePath);
        String normalizedVisitorId = normalizeVisitorId(visitorId);
        if (normalizedRoutePath == null || normalizedVisitorId == null) {
            return;
        }

        User user = userId == null ? null : users.getReferenceById(userId);
        pageViews.save(new PageViewEvent(user, normalizedVisitorId, normalizedRoutePath));
    }

    static String normalizeRoutePath(String routePath) {
        if (routePath == null) {
            return null;
        }

        String normalized = routePath.trim();
        if (normalized.isEmpty()) {
            return null;
        }

        int queryStart = normalized.indexOf('?');
        if (queryStart >= 0) {
            normalized = normalized.substring(0, queryStart);
        }

        int fragmentStart = normalized.indexOf('#');
        if (fragmentStart >= 0) {
            normalized = normalized.substring(0, fragmentStart);
        }

        if (!normalized.startsWith("/")) {
            normalized = "/" + normalized;
        }

        if (normalized.length() > 1) {
            normalized = normalized.replaceAll("/+$", "");
        }

        if (normalized.isBlank()) {
            normalized = "/";
        }

        return normalized.length() > MAX_ROUTE_PATH_LENGTH
            ? normalized.substring(0, MAX_ROUTE_PATH_LENGTH)
            : normalized;
    }

    static String normalizeVisitorId(String visitorId) {
        if (visitorId == null) {
            return null;
        }

        String normalized = visitorId.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty() || normalized.length() > MAX_VISITOR_ID_LENGTH) {
            return null;
        }

        return normalized;
    }
}
