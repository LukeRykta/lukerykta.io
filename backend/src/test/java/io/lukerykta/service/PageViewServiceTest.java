package io.lukerykta.service;

import io.lukerykta.entity.PageViewEvent;
import io.lukerykta.entity.User;
import io.lukerykta.repository.PageViewEventRepository;
import io.lukerykta.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PageViewServiceTest {

    @Test
    void recordPageView_normalizes_route_and_visitor_id() {
        PageViewEventRepository pageViews = mock(PageViewEventRepository.class);
        UserRepository users = mock(UserRepository.class);
        User user = new User("google", "sub-1");
        user.setId(42L);

        when(users.getReferenceById(42L)).thenReturn(user);

        PageViewService service = new PageViewService(pageViews, users);

        service.recordPageView(" /about/?campaign=spring#bio ", " VISITOR-ABC ", 42L);

        ArgumentCaptor<PageViewEvent> eventCaptor = ArgumentCaptor.forClass(PageViewEvent.class);
        verify(pageViews).save(eventCaptor.capture());

        PageViewEvent saved = eventCaptor.getValue();
        assertEquals("/about", saved.getRoutePath());
        assertEquals("visitor-abc", saved.getVisitorId());
        assertEquals(user, saved.getUser());
    }

    @Test
    void recordPageView_skips_invalid_payloads() {
        PageViewEventRepository pageViews = mock(PageViewEventRepository.class);
        UserRepository users = mock(UserRepository.class);
        PageViewService service = new PageViewService(pageViews, users);

        service.recordPageView("   ", "visitor-abc", null);
        service.recordPageView("/about", null, null);

        verify(pageViews, never()).save(org.mockito.ArgumentMatchers.any(PageViewEvent.class));
    }

    @Test
    void recordPageView_allows_anonymous_views() {
        PageViewEventRepository pageViews = mock(PageViewEventRepository.class);
        UserRepository users = mock(UserRepository.class);
        PageViewService service = new PageViewService(pageViews, users);

        service.recordPageView("/", "visitor-abc", null);

        ArgumentCaptor<PageViewEvent> eventCaptor = ArgumentCaptor.forClass(PageViewEvent.class);
        verify(pageViews).save(eventCaptor.capture());

        assertEquals("/", eventCaptor.getValue().getRoutePath());
        assertNull(eventCaptor.getValue().getUser());
    }
}
