package io.lukerykta.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "page_view_events")
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode
public class PageViewEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "visitor_id", nullable = false, length = 64)
    private String visitorId;

    @Column(name = "route_path", nullable = false, length = 255)
    private String routePath;

    @Column(name = "viewed_at", nullable = false, updatable = false)
    private Instant viewedAt;

    public PageViewEvent(User user, String visitorId, String routePath) {
        this.user = user;
        this.visitorId = visitorId;
        this.routePath = routePath;
    }

    @PrePersist
    void onCreate() {
        if (this.viewedAt == null) {
            this.viewedAt = Instant.now();
        }
    }
}
