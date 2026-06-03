package com.polyhub.repository;

import com.polyhub.entity.Document;
import com.polyhub.entity.SavedDocument;
import com.polyhub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavedDocumentRepository extends JpaRepository<SavedDocument, Long> {
    
    // Tìm các tài liệu đã lưu của một user, phân trang và sắp xếp theo ngày lưu giảm dần
    Page<SavedDocument> findByUserOrderBySavedAtDesc(User user, Pageable pageable);

    // Kiểm tra xem User đã lưu Document này chưa
    boolean existsByUserAndDocument(User user, Document document);

    // Lấy thông tin record đã lưu (nếu có)
    Optional<SavedDocument> findByUserAndDocument(User user, Document document);
    
    // Đếm tổng số tài liệu mà User đã lưu
    long countByUser(User user);

    @org.springframework.data.jpa.repository.Query("SELECT sd.document.id FROM SavedDocument sd WHERE sd.user = :user")
    java.util.List<Long> findDocumentIdsByUser(@org.springframework.data.repository.query.Param("user") User user);
}
