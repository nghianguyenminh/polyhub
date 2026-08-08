package com.polyhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "coin_transactions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CoinTransaction implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_username", nullable = false)
    @JsonIgnoreProperties({"password", "followers", "following"})
    private User user;

    @Column(nullable = false)
    private Integer amount; // Dương (+) khi nhận/hoàn xu, Âm (-) khi trừ xu

    @Column(nullable = false, length = 50)
    private String type; // SPENT, REFUND, EARNED, INITIAL_GRANT

    @Column(columnDefinition = "nvarchar(500)")
    private String description;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
