package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = true)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "username", nullable = false)
    private User reporter; // Người báo cáo

    @Column(nullable = false, length = 500)
    private String reason; // Lý do báo cáo

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING"; // Trạng thái báo cáo (PENDING, WARNED, LOCK_REQUESTED)

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}