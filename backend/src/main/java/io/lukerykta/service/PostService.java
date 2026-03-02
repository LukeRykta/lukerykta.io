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

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;

    public record LikeMutationResult(int likeCount, boolean likedByCurrentUser) {}

    public List<PostSummaryDto> findTopProjects(int limit, Long currentUserId) {
        int safeLimit = Math.max(1, Math.min(limit, 24));
        Pageable page = PageRequest.of(
            0,
            safeLimit,
            Sort.by(Sort.Order.desc("likeCount"), Sort.Order.desc("createdAt"))
        );

        List<Post> posts = postRepository.findByType(PostType.PROJECT, page).stream().toList();

        final Set<Long> likedPostIds;
        if (currentUserId != null && !posts.isEmpty()) {
            List<Long> postIds = posts.stream().map(Post::getId).toList();
            likedPostIds = new HashSet<>(postRepository.findLikedPostIds(currentUserId, postIds));
        } else {
            likedPostIds = Set.of();
        }

        return posts.stream()
            .map(post -> toSummary(post, likedPostIds.contains(post.getId())))
            .collect(Collectors.toList());
    }

    public List<PostSummaryDto> findTopProjects(int limit) {
        return findTopProjects(limit, null);
    }

    @Transactional
    public LikeMutationResult likePost(Long postId, Long userId) {
        requireExistingPost(postId);
        int inserted = postRepository.insertLikeIfAbsent(postId, userId);
        if (inserted > 0) {
            postRepository.adjustLikeCount(postId, 1);
        }
        int likeCount = readLikeCount(postId);
        return new LikeMutationResult(likeCount, true);
    }

    @Transactional
    public LikeMutationResult unlikePost(Long postId, Long userId) {
        requireExistingPost(postId);
        int deleted = postRepository.deleteLike(postId, userId);
        if (deleted > 0) {
            postRepository.adjustLikeCount(postId, -1);
        }
        int likeCount = readLikeCount(postId);
        return new LikeMutationResult(likeCount, false);
    }

    private void requireExistingPost(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
        }
    }

    private int readLikeCount(Long postId) {
        return postRepository.findLikeCount(postId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    private PostSummaryDto toSummary(Post post, boolean likedByCurrentUser) {
        return PostSummaryDto.builder()
            .id(post.getId())
            .type(post.getType())
            .title(post.getTitle())
            .content(post.getContent())
            .previewImageUrl(post.getPreviewImageUrl())
            .externalUrl(post.getExternalUrl())
            .likeCount(post.getLikeCount())
            .likedByCurrentUser(likedByCurrentUser)
            .createdAt(post.getCreatedAt())
            .build();
    }
}
