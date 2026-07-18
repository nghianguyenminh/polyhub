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
@Table(name = "Mentor_Busy_Periods")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MentorBusy implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_username", nullable = false)
    @JsonIgnoreProperties({"password", "email", "phone", "followers", "following"})
    private User mentor;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(columnDefinition = "nvarchar(500)")
    private String reason;

    @Column(name = "reliability_impact")
    private Double reliabilityImpact = 0.0;

    @Column(name = "admin_approved")
    private Boolean adminApproved = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (reliabilityImpact == null) reliabilityImpact = 0.0;
        if (adminApproved == null) adminApproved = false;
    }
}
