package com.polyhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_username", nullable = false)
    private User user; // Người nhận thông báo

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_username")
    private User sender; // Người gửi thông báo (nullable cho hệ thống)

    @Column(nullable = true, length = 1000)
    private String message; // Nội dung thông báo (hệ thống nâng cao)

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "type")
    private String type; // LIKE, COMMENT, SHARE, FOLLOW, SYSTEM

    @Column(name = "target_id")
    private Long targetId; // ID của đối tượng liên quan (ví dụ: postId)

    // Legacy fields to prevent build errors and support legacy system notifications
    @Column(columnDefinition = "nvarchar(100)", nullable = true)
    private String title;

    @Column(columnDefinition = "nvarchar(500)", nullable = true)
    private String content;

    @Column(length = 100, nullable = true)
    private String link;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
