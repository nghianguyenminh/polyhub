package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "amount", nullable = false)
    private Long amount;

    // "DEPOSIT" or "WITHDRAW"
    @Column(name = "type", nullable = false)
    private String type;

    // "PENDING", "SUCCESS", "REJECTED"
    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "tx_code")
    private String txCode;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
