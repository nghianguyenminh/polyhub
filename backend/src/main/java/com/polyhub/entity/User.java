package com.polyhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User implements Serializable {

    @Id
    @Column(length = 20)
    private String username;

    @Column(nullable = false)
    @JsonIgnore
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

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(name = "two_factor_code", length = 6)
    private String TwoFactorCode;

    @Column(name = "two_factor_code_expire_time")
    private LocalDateTime TwoFactorCodeExpireTime;

    @Column(name = "is_two_factor_enabled")
    private Boolean IsTwoFactorEnabled;

    @Column(name = "balance", columnDefinition = "bigint default 0")
    private Long balance = 0L;

    @Column(name = "price_per_minute", columnDefinition = "bigint default 1000")
    private Long pricePerMinute = 1000L;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_follows",
            joinColumns = @JoinColumn(name = "user_username"),
            inverseJoinColumns = @JoinColumn(name = "follower_username")
    )
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @JsonIgnore
    private java.util.Set<User> followers = new java.util.HashSet<>();

    @ManyToMany(mappedBy = "followers", fetch = FetchType.LAZY)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @JsonIgnore
    private java.util.Set<User> following = new java.util.HashSet<>();
}