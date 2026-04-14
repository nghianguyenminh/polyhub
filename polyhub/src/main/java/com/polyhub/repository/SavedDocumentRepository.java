package com.polyhub.repository;

import com.polyhub.entity.SavedDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavedDocumentRepository extends MongoRepository<SavedDocument, String> {

    // Tìm các tài liệu đã lưu của một user, phân trang và sắp xếp theo ngày lưu giảm dần
    Page<SavedDocument> findByUserIdOrderBySavedAtDesc(String userId, Pageable pageable);

    // Kiểm tra xem User đã lưu Document này chưa
    boolean existsByUserIdAndDocumentId(String userId, String documentId);

    // Lấy thông tin record đã lưu (nếu có)
    Optional<SavedDocument> findByUserIdAndDocumentId(String userId, String documentId);

    // Đếm tổng số tài liệu mà User đã lưu
    long countByUserId(String userId);
}
