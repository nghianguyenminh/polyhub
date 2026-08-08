package com.polyhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;


import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // Tránh lỗi Lazy Loading
public class User implements Serializable {

    @Id
    @Column(length = 20)
    private String username;

    @Column(nullable = false)
    @JsonIgnore // Bảo mật: Không bao giờ trả mật khẩu về phía Client qua JSON
    private String password;

    @Column(columnDefinition = "nvarchar(100)", nullable = false)
    private String fullname;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(length = 15)
    private String phone;

    private Boolean gender = true;

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthday;

    @Column(columnDefinition = "nvarchar(100)")
    private String major;

    private String avatar = "default.png";

    private String coverImage = "default-cover.jpg";

    private Boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(columnDefinition = "NVARCHAR(500)")
    private String bio; 

    @Column(name = "coins")
    private Integer coins = 100;

    public Integer getCoins() {
        return coins != null ? coins : 100;
    }

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    // --- KẾT NỐI NGƯỜI DÙNG ---
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_follows",
            joinColumns = @JoinColumn(name = "user_username"),
            inverseJoinColumns = @JoinColumn(name = "follower_username")
    )
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @JsonIgnore // CHẶN VÒNG LẶP
    private java.util.Set<User> followers = new java.util.HashSet<>();

    @ManyToMany(mappedBy = "followers", fetch = FetchType.LAZY)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @JsonIgnore // CHẶN VÒNG LẶP
    private java.util.Set<User> following = new java.util.HashSet<>();
}