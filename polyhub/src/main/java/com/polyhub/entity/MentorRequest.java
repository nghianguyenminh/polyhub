package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import org.springframework.format.annotation.DateTimeFormat;

@Data
@Entity
@Table(name = "mentor_requests")
public class MentorRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "username")
    private User user;

    @Column(columnDefinition = "TEXT")
    private String reason;

    private String status = "pending"; // pending, approved, rejected

    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime requestDate = LocalDateTime.now();

}
