package com.polyhub.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    private String id;

    private String title;

    private String description;

    // Loại file trích xuất (PDF, WORD, EXCEL) - Hỗ trợ lọc Dropdown bên Client
    private String documentType; 

    // URL tài liệu trên Cloudinary
    private String fileUrl;

    // Public ID dùng để xóa file trên Cloudinary khi cần thiết
    private String filePublicId;

    // Dung lượng file (tính bằng byte)
    private Long fileSize;

    // Số lượt tải xuống
    @Builder.Default
    private Integer downloadCount = 0;

    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING;

    private String rejectionReason;

    // Liên kết với Chuyên Ngành (Category) ManyToOne
    private String categoryId;

    // Bổ sung: Liên kết với Người dùng upload (Sinh viên/Mentor)
    private String uploaderId;

    private LocalDateTime createdAt;

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
