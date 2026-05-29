package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories") // Danh mục Chuyên ngành
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ví dụ: IT, GRAPHIC, BIZ
    @Column(nullable = false, unique = true, length = 20)
    private String code;

    // Ví dụ: Công nghệ thông tin, Thiết kế đồ họa
    @Column(nullable = false)
    private String name;

    // Trạng thái hoạt động: true = đang dùng, false = tạm ẩn
    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    // Một chuyên ngành có thể có nhiều Tài liệu
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Document> documents = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
