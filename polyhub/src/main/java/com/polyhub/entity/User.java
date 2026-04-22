package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Users")
public class User implements Serializable {

    @Id
    @Column(length = 20)
    private String username; // Tên đăng nhập (ID)

    @Column(nullable = false)
    private String password;

    @Column(columnDefinition = "nvarchar(100)", nullable = false)
    private String fullname;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(length = 15)
    private String phone;

    private Boolean gender = true; // True: Nam, False: Nữ

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthday;

    @Column(columnDefinition = "nvarchar(100)")
    private String major; // Chuyên ngành

    private String avatar = "default.png";

    // Ảnh bìa
    private String coverImage = "default-cover.jpg";

    private Boolean active = true; // Trạng thái hoạt động

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Thêm biến này vào danh sách các thuộc tính
    @Column(columnDefinition = "NVARCHAR(500)")
    private String bio; 

    // --- KẾT NỐI VỚI BẢNG ROLE ---
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    // --- KẾT NỐI NGƯỜI DÙNG (FOLLOWERS/FOLLOWING) ---
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_follows",
            joinColumns = @JoinColumn(name = "user_username"),
            inverseJoinColumns = @JoinColumn(name = "follower_username")
    )
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private java.util.Set<User> followers = new java.util.HashSet<>();

    @ManyToMany(mappedBy = "followers", fetch = FetchType.LAZY)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private java.util.Set<User> following = new java.util.HashSet<>();
}