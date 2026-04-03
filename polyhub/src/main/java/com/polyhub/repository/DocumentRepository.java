package com.polyhub.repository;

import com.polyhub.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Tìm tất cả tài liệu của 1 chuyên ngành cụ thể
    List<Document> findByCategoryId(Long categoryId);
    
    // Tìm tất cả tài liệu lọc theo Định dạng FILE (PDF, WORD, EXCEL)
    List<Document> findByDocumentTypeIgnoreCase(String documentType);

    // Lọc tổng hợp nhiều DK (Chuyên ngành & Loại File)
    List<Document> findByCategoryIdAndDocumentTypeIgnoreCase(Long categoryId, String documentType);
}
