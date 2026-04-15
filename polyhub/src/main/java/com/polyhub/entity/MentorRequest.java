package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "Mentor_Requests")
public class MentorRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(columnDefinition = "nvarchar(100)", nullable = false)
    private String fullname;

    @Column(nullable = false)
    private String email;

    @Column(length = 15)
    private String phone;

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthday;

    @Column(name = "cccd_number", length = 20, nullable = false)
    private String cccdNumber;
    
    @Column(columnDefinition = "nvarchar(255)")
    private String specialized;

    @Column(columnDefinition = "nvarchar(1500)")
    private String description;
    
    @Column(columnDefinition = "nvarchar(255)")
    private String facebookLink;

    @Column(columnDefinition = "nvarchar(255)")
    private String zaloLink;

    @Column(columnDefinition = "nvarchar(255)")
    private String githubLink;

    @Column(columnDefinition = "nvarchar(1500)", nullable = false)
    private String introduction;

    @Column(columnDefinition = "nvarchar(1500)", nullable = false)
    private String motivation;

    @Column(name = "cv_file", nullable = false)
    private String cvFile;

    @Column(name = "certificate_file")
    private String certificateFile;
    
    @Column(name = "certificate1")
    private String certificate1;
    
    @Column(name = "certificate2")
    private String certificate2;

    @Column(name = "degree_file")
    private String degreeFile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MentorRequestStatus status = MentorRequestStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}