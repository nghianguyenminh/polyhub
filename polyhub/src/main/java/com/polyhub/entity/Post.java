package com.polyhub.entity;

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

    // --- Tính năng Share (Bắt đầu) ---
    // Nơi chứa id của bài viết gốc nếu đây là 1 bài share
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_post_id")
    private Post sharedPost;
    
    // Tính năng đếm số lượt Share của 1 bài gốc (orphanRemoval = false vì xoá lượt Share thì ko xoá bài Gốc)
    @OneToMany(mappedBy = "sharedPost", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Post> shares = new ArrayList<>();
    // --- Tính năng Share (Kết thúc) ---

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}