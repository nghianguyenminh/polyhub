package com.polyhub.entity;

import jakarta.persistence.*;
<<<<<<< HEAD
import lombok.Data;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;

@Data
@Entity
@Table(name = "mentor_requests")
public class MentorRequest {
=======
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
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

<<<<<<< HEAD
    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "username")
    private User user;

    @Column(columnDefinition = "TEXT")
    private String reason;

    private String status = "pending"; // pending, approved, rejected

    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime requestDate = LocalDateTime.now();

=======
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
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
}
