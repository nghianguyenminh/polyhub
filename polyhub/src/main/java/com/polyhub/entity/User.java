package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullname;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    private LocalDate birthday;

    private Boolean gender;

    private String major;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false)
    private String avatar = "default.png";

    private String coverImage = "default.png";

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private Boolean wantsToBecomeMentor = false;

    @Column(name = "mentor_major")
    private String mentorMajor;

    @Column(name = "mentor_reason", columnDefinition = "TEXT")
    private String mentorReason;

    @Column(name = "evidence_link")
    private String evidenceLink;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;

}
