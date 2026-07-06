package com.polyhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Bookings")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Booking implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_username", nullable = false)
    @JsonIgnoreProperties({"password", "followers", "following"})
    private User mentor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_username", nullable = false)
    @JsonIgnoreProperties({"password", "followers", "following"})
    private User student;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private Integer duration; // 20, 30, 40, 50, 60 phút

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(columnDefinition = "nvarchar(500)")
    private String note;

    @Column(name = "room_id", length = 50)
    private String roomId;

    @Column(name = "rejection_reason", columnDefinition = "nvarchar(500)")
    private String rejectionReason;

    @Column(name = "mentor_joined")
    private Boolean mentorJoined = false;

    @Column(name = "student_joined")
    private Boolean studentJoined = false;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "extension_count")
    private Integer extensionCount = 0; // Số lần đã gia hạn

    @Column(name = "max_extensions")
    private Integer maxExtensions = 3; // Tối đa 3 lần gia hạn mỗi session

    @Column(name = "extended_minutes")
    private Integer extendedMinutes = 0; // Tổng số phút đã được gia hạn thêm

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = BookingStatus.PENDING;
        }
        if (mentorJoined == null) mentorJoined = false;
        if (studentJoined == null) studentJoined = false;
        if (extensionCount == null) extensionCount = 0;
        if (maxExtensions == null) maxExtensions = 3;
        if (extendedMinutes == null) extendedMinutes = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
