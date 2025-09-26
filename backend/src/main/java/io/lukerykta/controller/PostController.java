package io.lukerykta.controller;

import io.lukerykta.dto.PostSummaryDto;
import io.lukerykta.service.PostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public/posts")
@CrossOrigin(origins = "*")
public class PostController {

    private final PostService postService;

    @GetMapping("/projects")
    public List<PostSummaryDto> getProjects(@RequestParam(name = "limit", defaultValue = "4") int limit) {
        log.debug("Requesting top projects with limit={}", limit);
        return postService.findTopProjects(limit);
    }
}
