package io.lukerykta.service;

import io.lukerykta.repository.PostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @InjectMocks
    private PostService postService;

    @Test
    void likePost_incrementsLikeCount_whenUserLikesForFirstTime() {
        when(postRepository.existsById(12L)).thenReturn(true);
        when(postRepository.insertLikeIfAbsent(12L, 7L)).thenReturn(1);
        when(postRepository.findLikeCount(12L)).thenReturn(Optional.of(9));

        PostService.LikeMutationResult result = postService.likePost(12L, 7L);

        assertThat(result.likeCount()).isEqualTo(9);
        assertThat(result.likedByCurrentUser()).isTrue();
        verify(postRepository).adjustLikeCount(12L, 1);
    }

    @Test
    void likePost_doesNotIncrementLikeCount_whenDuplicateLikeRequestArrives() {
        when(postRepository.existsById(12L)).thenReturn(true);
        when(postRepository.insertLikeIfAbsent(12L, 7L)).thenReturn(0);
        when(postRepository.findLikeCount(12L)).thenReturn(Optional.of(9));

        PostService.LikeMutationResult result = postService.likePost(12L, 7L);

        assertThat(result.likeCount()).isEqualTo(9);
        assertThat(result.likedByCurrentUser()).isTrue();
        verify(postRepository, never()).adjustLikeCount(12L, 1);
    }

    @Test
    void unlikePost_decrementsLikeCount_whenExistingLikeIsRemoved() {
        when(postRepository.existsById(12L)).thenReturn(true);
        when(postRepository.deleteLike(12L, 7L)).thenReturn(1);
        when(postRepository.findLikeCount(12L)).thenReturn(Optional.of(8));

        PostService.LikeMutationResult result = postService.unlikePost(12L, 7L);

        assertThat(result.likeCount()).isEqualTo(8);
        assertThat(result.likedByCurrentUser()).isFalse();
        verify(postRepository).adjustLikeCount(12L, -1);
    }

    @Test
    void likePost_throwsNotFound_whenPostDoesNotExist() {
        when(postRepository.existsById(404L)).thenReturn(false);

        assertThatThrownBy(() -> postService.likePost(404L, 7L))
            .isInstanceOf(ResponseStatusException.class)
            .extracting((error) -> ((ResponseStatusException) error).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);

        verify(postRepository, never()).insertLikeIfAbsent(anyLong(), anyLong());
    }
}
