package io.lukerykta.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Slf4j
@Table(name = "posts", indexes = {
    @Index(name = "idx_posts_author", columnList = "author_id"),
    @Index(name = "idx_posts_type", columnList = "type")
})
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_posts_author"))
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PostType type;

    @Column(nullable = false, length = 191)
    private String title;

    @Column(columnDefinition = "text", nullable = false)
    private String content;

    @Column(name = "like_count", nullable = false)
    private int likeCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = this.updatedAt = Instant.now();
        Long authorId = author != null ? author.getId() : null;
        log.debug("Creating post type={} author={}", type, authorId);
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
        log.debug("Updating post id={} type={} author={}", id, type, author != null ? author.getId() : null);
    }
}
