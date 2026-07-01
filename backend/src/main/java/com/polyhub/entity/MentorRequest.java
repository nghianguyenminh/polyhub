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
@Table(name = "Mentor_Requests")
public class MentorRequest implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "username", nullable = false)
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

    @Column(name = "cccd_front_file")
    private String cccdFrontFile;

    @Column(name = "cccd_back_file")
    private String cccdBackFile;

    @Column(name = "face_file")
    private String faceFile;

    @Column(columnDefinition = "nvarchar(1500)", nullable = false)
    private String introduction;

    @Column(columnDefinition = "nvarchar(1500)", nullable = false)
    private String motivation;

    @Column(name = "cv_file", nullable = false)
    private String cvFile;

    @Column(name = "certificate_file")
    private String certificateFile;

    @Column(name = "degree_file")
    private String degreeFile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "rejection_reason", columnDefinition = "nvarchar(1000)")
    private String rejectionReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
