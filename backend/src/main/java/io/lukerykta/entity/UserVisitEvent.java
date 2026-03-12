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
@Table(name = "user_visit_events")
@NoArgsConstructor
@Getter
@Setter
@EqualsAndHashCode
public class UserVisitEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "visited_at", nullable = false, updatable = false)
    private Instant visitedAt;

    public UserVisitEvent(User user) {
        this.user = user;
    }

    @PrePersist
    void onCreate() {
        if (this.visitedAt == null) {
            this.visitedAt = Instant.now();
        }
    }
}
