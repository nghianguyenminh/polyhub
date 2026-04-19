package com.polyhub.repository;

import com.polyhub.entity.Document;
import com.polyhub.entity.DocumentStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {

    long countByStatus(DocumentStatus status);

<<<<<<< HEAD
    @Query("SELECT d.category.name, COUNT(d) FROM Document d GROUP BY d.category.name")
    List<Object[]> countDocumentsByCategory();
=======
    List<Document> findByCategoryIdAndDocumentTypeIgnoreCase(Long categoryId, String documentType);

    List<Document> findByStatus(DocumentStatus status);

    @Query("SELECT d FROM Document d LEFT JOIN d.category c WHERE " +
           "(:status IS NULL OR d.status = :status) AND " +
           "(:documentType IS NULL OR :documentType = '' OR d.documentType = :documentType) AND " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:categoryId IS NULL OR d.category.id = :categoryId)")
    Page<Document> searchAndFilterDocuments(
            @Param("status") DocumentStatus status,
            @Param("documentType") String documentType,
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            Pageable pageable);

    @Query("SELECT d.documentType, COUNT(d) FROM Document d WHERE d.status = 'APPROVED' AND d.documentType IS NOT NULL GROUP BY d.documentType")
    List<Object[]> countApprovedByDocumentType();

    @Query("SELECT c.id, COUNT(d) FROM Document d JOIN d.category c WHERE d.status = 'APPROVED' GROUP BY c.id")
    List<Object[]> countApprovedByCategory();

    @Query("SELECT d.documentType, COUNT(d) FROM Document d WHERE d.documentType IS NOT NULL GROUP BY d.documentType")
    List<Object[]> countByDocumentType();

    @Query("SELECT c.id, c.name, COUNT(d) FROM Document d JOIN d.category c GROUP BY c.id, c.name")
    List<Object[]> countByCategory();

    @Query("SELECT d.status, COUNT(d) FROM Document d GROUP BY d.status")
    List<Object[]> countByStatus();
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
}
