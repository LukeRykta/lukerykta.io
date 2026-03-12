package io.lukerykta.controller;

import io.lukerykta.dto.AdminUserPageDto;
import io.lukerykta.dto.AdminOverviewDto;
import io.lukerykta.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminDashboardService dashboard;

    @GetMapping("/stats/overview")
    public AdminOverviewDto overview() {
        return dashboard.getOverview();
    }

    @GetMapping("/users")
    public AdminUserPageDto users(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "lastSeen") String sortBy,
        @RequestParam(defaultValue = "desc") String direction
    ) {
        return dashboard.getUsers(page, size, sortBy, direction);
    }
}
