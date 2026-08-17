package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Loại file trích xuất (PDF, WORD, EXCEL) - Hỗ trợ lọc Dropdown bên Client
    @Column(length = 20)
    private String documentType; 

    // URL tài liệu trên Cloudinary
    @Column(nullable = false, length = 1000)
    private String fileUrl;

    // Public ID dùng để xóa file trên Cloudinary khi cần thiết
    @Column(length = 255)
    private String filePublicId;

    // Dung lượng file (tính bằng byte)
    private Long fileSize;

    // Số lượt tải xuống
    @Builder.Default
    private Integer downloadCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @Column(length = 500)
    private String aiKeywords;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private SummaryStatus summaryStatus = SummaryStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    // Liên kết với Chuyên Ngành (Category) ManyToOne
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @NotFound(action = NotFoundAction.IGNORE)
    @JsonIgnoreProperties("documents") // Tránh vòng lặp vô hạn khi truy vấn Category kèm Document    
    private Category category;

    // Bổ sung: Liên kết với Người dùng upload (Sinh viên/Mentor)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = true) // Cứ mở nullable để không chết các data DB cũ
    @NotFound(action = NotFoundAction.IGNORE)
    private User uploader;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
