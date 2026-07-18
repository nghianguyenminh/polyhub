package com.polyhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Booking_Priorities")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class BookingPriority implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_username", nullable = false)
    @JsonIgnoreProperties({"password", "email", "phone", "followers", "following"})
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_username", nullable = false)
    @JsonIgnoreProperties({"password", "email", "phone", "followers", "following"})
    private User mentor;

    @Column(name = "original_booking_id")
    private Long originalBookingId;

    @Column(nullable = false)
    private Integer duration;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "priority_order", nullable = false)
    private Long priorityOrder; // Thời gian booking gốc tạo ra (dùng làm epoch milli để so sánh)

    @Enumerated(EnumType.STRING)
    private PriorityStatus status = PriorityStatus.ACTIVE;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = PriorityStatus.ACTIVE;
    }
}
