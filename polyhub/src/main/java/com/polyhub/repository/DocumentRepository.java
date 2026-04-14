package com.polyhub.repository;

import com.polyhub.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends MongoRepository<Document, String> {

    List<Document> findByCategoryId(String categoryId);

    List<Document> findByDocumentTypeIgnoreCase(String documentType);

    List<Document> findByCategoryIdAndDocumentTypeIgnoreCase(String categoryId, String documentType);

    List<Document> findByStatus(String status);

    Page<Document> findByStatusAndDocumentTypeAndTitleContainingIgnoreCaseAndCategoryId(String status, String documentType, String title, String categoryId, Pageable pageable);

    Page<Document> findByStatusAndDocumentTypeAndTitleContainingIgnoreCase(String status, String documentType, String title, Pageable pageable);

    Page<Document> findByStatusAndTitleContainingIgnoreCaseAndCategoryId(String status, String title, String categoryId, Pageable pageable);

    Page<Document> findByStatusAndTitleContainingIgnoreCase(String status, String title, Pageable pageable);
    
    long countByStatus(String status);

    long countByDocumentType(String documentType);

    long countByCategoryId(String categoryId);
}
