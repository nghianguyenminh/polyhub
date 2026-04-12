package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
<<<<<<< HEAD
import java.util.Date;
import java.util.List;
=======
import java.time.LocalDate;
import java.time.LocalDateTime;
>>>>>>> origin/appmod/java-upgrade-20260406032344

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

    @Column(columnDefinition = "VARCHAR(100)", nullable = false)
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

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "VARCHAR(255)")
    private String school;

    @Column(columnDefinition = "VARCHAR(255)")
    private String address;

    private Boolean active = true; // Trạng thái hoạt động

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private Boolean wantsToBecomeMentor = false;

    private String mentorMajor;

    private Double gpa;

    private String rejectionReason;

    private String mentorReason;

    @ElementCollection
    private List<String> mentorSkills;

    private String evidenceLink;

    private String evidenceName;

    // --- KẾT NỐI VỚI BẢNG ROLE ---
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role; 
}