package com.polyhub.entity;

import jakarta.persistence.*;
<<<<<<< HEAD
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
=======
import lombok.*;
import java.util.Date;
import java.io.Serializable;
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
<<<<<<< HEAD
@Table(name = "saved_documents")
public class SavedDocument {
=======
@Table(name = "Saved_Documents")
public class SavedDocument implements Serializable {
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

<<<<<<< HEAD
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "username")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @Column(nullable = false)
    private LocalDateTime savedAt = LocalDateTime.now();

}
=======
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
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
