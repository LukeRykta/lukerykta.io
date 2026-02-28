package io.lukerykta.service;

import io.lukerykta.dto.PostSummaryDto;
import io.lukerykta.entity.Post;
import io.lukerykta.entity.PostType;
import io.lukerykta.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;

    public List<PostSummaryDto> findTopProjects(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 24));
        Pageable page = PageRequest.of(0, safeLimit,
            Sort.by(Sort.Order.desc("likeCount"), Sort.Order.desc("createdAt")));

        return postRepository.findByType(PostType.PROJECT, page).stream()
            .map(this::toSummary)
            .collect(Collectors.toList());
    }

    @Transactional
    public int incrementLike(Long postId) {
        return adjustLikeCount(postId, 1);
    }

    @Transactional
    public int decrementLike(Long postId) {
        return adjustLikeCount(postId, -1);
    }

    private int adjustLikeCount(Long postId, int delta) {
        log.debug("Adjusting like count delta={} for post={} ", delta, postId);
        int updated = postRepository.adjustLikeCount(postId, delta);
        return postRepository.findLikeCount(postId)
            .map(count -> {
                if (updated == 0 && delta > 0) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
                }
                return count;
            })
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    private PostSummaryDto toSummary(Post post) {
        return PostSummaryDto.builder()
            .id(post.getId())
            .type(post.getType())
            .title(post.getTitle())
            .content(post.getContent())
            .previewImageUrl(post.getPreviewImageUrl())
            .externalUrl(post.getExternalUrl())
            .likeCount(post.getLikeCount())
            .createdAt(post.getCreatedAt())
            .build();
    }
}
