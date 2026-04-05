package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.*;
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

    // Liên kết với Chuyên Ngành (Category) ManyToOne
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
