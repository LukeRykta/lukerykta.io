package io.lukerykta.controller;

import io.lukerykta.dto.AdminUserPageDto;
import io.lukerykta.dto.AdminOverviewDto;
import io.lukerykta.dto.AdminPopularRouteDto;
import io.lukerykta.dto.AdminUserRowDto;
import io.lukerykta.service.AdminDashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.client.OAuth2ClientAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientWebSecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@ImportAutoConfiguration(exclude = {
    OAuth2ClientAutoConfiguration.class,
    OAuth2ClientWebSecurityAutoConfiguration.class
})
class AdminControllerTest {

    @Autowired MockMvc mvc;

    @MockitoBean AdminDashboardService dashboard;

    @TestConfiguration
    static class SecurityTestConfig {
        @Bean
        SecurityFilterChain testChain(HttpSecurity http) throws Exception {
            http.authorizeHttpRequests(a -> a
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    .anyRequest().permitAll())
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(Customizer.withDefaults());
            return http.build();
        }
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void overview_returns_stats_for_admin() throws Exception {
        given(dashboard.getOverview()).willReturn(new AdminOverviewDto(
            12,
            63,
            4,
            28,
            63,
            6,
            41,
            List.of(
                new AdminPopularRouteDto("/", 18, 12, Instant.parse("2026-03-11T16:21:00Z")),
                new AdminPopularRouteDto("/projects", 11, 7, Instant.parse("2026-03-11T15:10:00Z"))
            )
        ));

        mvc.perform(get("/api/admin/stats/overview"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.totalUsers").value(12))
            .andExpect(jsonPath("$.totalVisits").value(63))
            .andExpect(jsonPath("$.visitsToday").value(4))
            .andExpect(jsonPath("$.visitsThisMonth").value(28))
            .andExpect(jsonPath("$.visitsThisYear").value(63))
            .andExpect(jsonPath("$.totalProjects").value(6))
            .andExpect(jsonPath("$.totalLikes").value(41))
            .andExpect(jsonPath("$.topRoutes[0].routePath").value("/"))
            .andExpect(jsonPath("$.topRoutes[0].viewCount").value(18))
            .andExpect(jsonPath("$.topRoutes[0].uniqueVisitorCount").value(12))
            .andExpect(jsonPath("$.topRoutes[1].routePath").value("/projects"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void users_returns_rows_for_admin() throws Exception {
        given(dashboard.getUsers(1, 25, "email", "asc")).willReturn(new AdminUserPageDto(
            List.of(new AdminUserRowDto(
                7L,
                "https://avatars.githubusercontent.com/u/7",
                "admin@example.com",
                "Admin User",
                "github",
                Instant.parse("2026-03-09T12:00:00Z"),
                Instant.parse("2026-03-10T15:30:45Z"),
                14
            )),
            1,
            25,
            61,
            3,
            "email",
            "asc",
            true,
            true
        ));

        mvc.perform(get("/api/admin/users")
                .param("page", "1")
                .param("size", "25")
                .param("sortBy", "email")
                .param("direction", "asc"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.page").value(1))
            .andExpect(jsonPath("$.size").value(25))
            .andExpect(jsonPath("$.totalElements").value(61))
            .andExpect(jsonPath("$.totalPages").value(3))
            .andExpect(jsonPath("$.sortBy").value("email"))
            .andExpect(jsonPath("$.direction").value("asc"))
            .andExpect(jsonPath("$.hasNext").value(true))
            .andExpect(jsonPath("$.hasPrevious").value(true))
            .andExpect(jsonPath("$.items[0].id").value(7))
            .andExpect(jsonPath("$.items[0].avatarUrl").value("https://avatars.githubusercontent.com/u/7"))
            .andExpect(jsonPath("$.items[0].email").value("admin@example.com"))
            .andExpect(jsonPath("$.items[0].displayName").value("Admin User"))
            .andExpect(jsonPath("$.items[0].provider").value("github"))
            .andExpect(jsonPath("$.items[0].firstLoginAt").value("2026-03-09T12:00:00Z"))
            .andExpect(jsonPath("$.items[0].lastSeenAt").value("2026-03-10T15:30:45Z"))
            .andExpect(jsonPath("$.items[0].visitCount").value(14));

        then(dashboard).should().getUsers(1, 25, "email", "asc");
    }

    @Test
    @WithMockUser(roles = "AUTHENTICATED_VISITOR")
    void users_forbidden_for_non_admin() throws Exception {
        mvc.perform(get("/api/admin/users"))
            .andExpect(status().isForbidden());
    }
}
