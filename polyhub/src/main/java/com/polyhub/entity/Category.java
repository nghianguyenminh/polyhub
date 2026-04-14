package com.polyhub.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "categories") // Danh mục Chuyên ngành
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    private String id;

    // Ví dụ: IT, GRAPHIC, BIZ
    private String code;

    // Ví dụ: Công nghệ thông tin, Thiết kế đồ họa
    private String name;

    // Trạng thái hoạt động: true = đang dùng, false = tạm ẩn
    @Builder.Default
    private boolean isActive = true;

    private LocalDateTime createdAt;

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
