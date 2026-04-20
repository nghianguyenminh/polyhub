package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "username")
    private User user;

<<<<<<< HEAD
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private String imageUrl;

}
=======
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

    // --- Xoá bài thì xoá luôn Report ---
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostReport> reports = new ArrayList<>();

    // Quyền riêng tư của bài viết (false = Công khai, true = Chỉ mình tôi)
    @Column(name = "is_private")
    @Builder.Default
    private Boolean isPrivate = false;

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

    // --- Xoá bài thì xoá luôn Report ---
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostReport> reports = new ArrayList<>();

    // Quyền riêng tư của bài viết (false = Công khai, true = Chỉ mình tôi)
    @Column(name = "is_private")
    @Builder.Default
    private Boolean isPrivate = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
