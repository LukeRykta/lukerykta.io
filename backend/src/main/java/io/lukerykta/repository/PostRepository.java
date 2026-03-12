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

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByType(PostType type, Pageable pageable);
    long countByType(PostType type);

    @Query("select coalesce(sum(p.likeCount), 0) from Post p")
    Long sumLikeCount();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update posts set like_count = like_count + :delta " +
        "where id = :postId and like_count + :delta >= 0", nativeQuery = true)
    int adjustLikeCount(@Param("postId") Long postId, @Param("delta") int delta);

    @Query("select p.likeCount from Post p where p.id = :postId")
    Optional<Integer> findLikeCount(@Param("postId") Long postId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = "insert into post_likes (post_id, user_id) " +
            "select :postId, :userId " +
            "where not exists (" +
            "  select 1 from post_likes where post_id = :postId and user_id = :userId" +
            ")",
        nativeQuery = true
    )
    int insertLikeIfAbsent(@Param("postId") Long postId, @Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = "delete from post_likes where post_id = :postId and user_id = :userId",
        nativeQuery = true
    )
    int deleteLike(@Param("postId") Long postId, @Param("userId") Long userId);

    @Query(
        value = "select post_id from post_likes where user_id = :userId and post_id in (:postIds)",
        nativeQuery = true
    )
    List<Long> findLikedPostIds(
        @Param("userId") Long userId,
        @Param("postIds") Collection<Long> postIds
    );
}
