package com.polyhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Mentor_Schedules")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MentorSchedule implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_username", nullable = false)
    @JsonIgnoreProperties({"password", "email", "phone", "gender", "birthday", "followers", "following"})
    private User mentor;

    @Column(nullable = false)
    private Integer dayOfWeek; // 2 = Thứ 2, 3 = Thứ 3, ..., 8 = Chủ Nhật

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
}
