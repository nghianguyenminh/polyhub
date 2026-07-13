package com.polyhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" }) // Tránh lỗi Lazy Loading khi chuyển sang JSON
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(length = 1000)
    private String imageUrl;

    @Column(length = 255)
    private String imagePublicId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "username", nullable = false)
    private User user;

    // --- Tính năng Share ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_post_id")
    private Post sharedPost;

    @OneToMany(mappedBy = "sharedPost", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore // CHẶN VÒNG LẶP: Không trả về danh sách các bài đã share khi xem một bài viết
    private List<Post> shares = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore // CHẶN VÒNG LẶP: Không cần thiết trả về danh sách report trong API bài viết
                // thông thường
    private List<PostReport> reports = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<SavedPost> savedPosts = new ArrayList<>();

    @Column(name = "is_private")
    @Builder.Default
    private Boolean isPrivate = false;

    @Column(name = "hot_score", nullable = false, columnDefinition = "double default 0.0")
    @Builder.Default
    private Double hotScore = 0.0;

    @Column(name = "is_locked")
    @Builder.Default
    private Boolean isLocked = false;
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}