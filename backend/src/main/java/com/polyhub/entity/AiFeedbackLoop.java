package com.polyhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "Ai_Feedback_Loops")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiFeedbackLoop implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_busy_id", nullable = false)
    @JsonIgnoreProperties({"mentor"})
    private MentorBusy mentorBusy;

    @Column(name = "ai_proposed_penalty", nullable = false)
    private Double aiProposedPenalty;

    @Column(name = "admin_actual_penalty", nullable = false)
    private Double adminActualPenalty;

    @Column(name = "admin_adjustment_reason", columnDefinition = "nvarchar(500)")
    private String adminAdjustmentReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
