package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String fileUrl;

    private String thumbnailUrl;

    private String documentType; // e.g., "ASSIGNMENT", "TUTORIAL"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User uploader;

    @Enumerated(EnumType.STRING)
    private DocumentStatus status = DocumentStatus.PENDING;

    private String rejectionReason;

    private String filePublicId;

    private Long fileSize;

    private int downloadCount = 0;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime approvedAt;

    private LocalDateTime hiddenAt;
}
