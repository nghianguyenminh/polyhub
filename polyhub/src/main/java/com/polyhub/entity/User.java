package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.Date;
import java.util.List;

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

    @Temporal(TemporalType.DATE)
    private Date birthday;

    private String avatar = "default.png";

    // Ảnh bìa
    private String coverImage = "default-cover.jpg";

    private String bio;

    private Boolean active = true; // Trạng thái hoạt động

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", updatable = false)
    private Date createdAt = new Date();

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