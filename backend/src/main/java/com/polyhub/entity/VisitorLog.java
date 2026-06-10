package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@Entity
@Table(name = "visitor_logs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ip_address", "access_date"})
})
public class VisitorLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ip_address", length = 45, nullable = false)
    private String ipAddress;

    @Column(name = "access_date", nullable = false)
    private LocalDate accessDate;

    public VisitorLog(String ipAddress, LocalDate accessDate) {
        this.ipAddress = ipAddress;
        this.accessDate = accessDate;
    }
}
