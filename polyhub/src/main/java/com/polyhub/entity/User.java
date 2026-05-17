package com.polyhub.entity;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import org.springframework.format.annotation.DateTimeFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

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

	@Column(columnDefinition = "nvarchar(255)")
	private String bio;

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
    private Set<User> followers = new HashSet<>();

    @ManyToMany(mappedBy = "followers", fetch = FetchType.LAZY)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Set<User> following = new HashSet<>();
}
