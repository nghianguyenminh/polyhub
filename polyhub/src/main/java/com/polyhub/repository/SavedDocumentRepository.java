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
<<<<<<< HEAD

    Page<SavedDocument> findByUserOrderBySavedAtDesc(User user, Pageable pageable);

    Optional<SavedDocument> findByUserAndDocument(User user, Document document);

=======
    
    // Tìm các tài liệu đã lưu của một user, phân trang và sắp xếp theo ngày lưu giảm dần
    Page<SavedDocument> findByUserOrderBySavedAtDesc(User user, Pageable pageable);

    // Kiểm tra xem User đã lưu Document này chưa
    boolean existsByUserAndDocument(User user, Document document);

    // Lấy thông tin record đã lưu (nếu có)
    Optional<SavedDocument> findByUserAndDocument(User user, Document document);
    
    // Đếm tổng số tài liệu mà User đã lưu
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
    long countByUser(User user);
}
