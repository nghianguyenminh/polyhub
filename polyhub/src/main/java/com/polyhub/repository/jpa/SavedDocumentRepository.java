package com.polyhub.repository.jpa;

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
}
