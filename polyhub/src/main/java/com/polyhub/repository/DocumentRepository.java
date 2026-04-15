package com.polyhub.repository;

import com.polyhub.entity.Document;
import com.polyhub.entity.DocumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    long countByStatus(DocumentStatus status);

    Page<Document> findByStatusAndDocumentTypeAndTitleContainingIgnoreCaseAndCategoryId(DocumentStatus status, String documentType, String keyword, Long categoryId, Pageable pageable);

    Page<Document> findByStatusAndDocumentTypeAndTitleContainingIgnoreCase(DocumentStatus status, String documentType, String keyword, Pageable pageable);

    Page<Document> findByStatusAndTitleContainingIgnoreCaseAndCategoryId(DocumentStatus status, String keyword, Long categoryId, Pageable pageable);

    Page<Document> findByStatusAndTitleContainingIgnoreCase(DocumentStatus status, String keyword, Pageable pageable);

    List<Document> findByStatus(DocumentStatus status);

    @Query("SELECT d FROM Document d " +
            "WHERE (:status IS NULL OR d.status = :status) " +
            "AND (:documentType IS NULL OR d.documentType = :documentType) " +
            "AND (:keyword IS NULL OR d.title LIKE %:keyword%) " +
            "AND (:categoryId IS NULL OR d.category.id = :categoryId)")
    Page<Document> searchAndFilterDocuments(@Param("status") DocumentStatus status,
                                            @Param("documentType") String documentType,
                                            @Param("keyword") String keyword,
                                            @Param("categoryId") Long categoryId,
                                            Pageable pageable);

    @Query("SELECT d.documentType, COUNT(d) FROM Document d WHERE d.status = 'APPROVED' GROUP BY d.documentType")
    List<Object[]> countApprovedByDocumentType();

    @Query("SELECT d.category.id, COUNT(d) FROM Document d WHERE d.status = 'APPROVED' GROUP BY d.category.id")
    List<Object[]> countApprovedByCategory();

    @Query("SELECT d.documentType, COUNT(d) FROM Document d GROUP BY d.documentType")
    List<Object[]> countByDocumentType();

    @Query("SELECT c.name, COUNT(d.id) FROM Category c LEFT JOIN c.documents d GROUP BY c.name")
    List<Object[]> countByCategory();

    @Query("SELECT d.status, COUNT(d) FROM Document d GROUP BY d.status")
    List<Object[]> countByStatus();
}