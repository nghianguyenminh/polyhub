package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Saved_Documents")
public class SavedDocument implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mapping tới User (Ai đã lưu)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Mapping tới Document (Tài liệu nào được lưu)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    // Thời gian lưu
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "saved_at", updatable = false)
    private Date savedAt = new Date();
}
