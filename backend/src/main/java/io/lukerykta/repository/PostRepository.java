package io.lukerykta.repository;

import io.lukerykta.entity.Post;
import io.lukerykta.entity.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByType(PostType type, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update posts set like_count = like_count + :delta " +
        "where id = :postId and like_count + :delta >= 0", nativeQuery = true)
    int adjustLikeCount(@Param("postId") Long postId, @Param("delta") int delta);

    @Query("select p.likeCount from Post p where p.id = :postId")
    Optional<Integer> findLikeCount(@Param("postId") Long postId);
}
