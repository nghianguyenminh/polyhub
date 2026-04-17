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

    @Query("SELECT d.category.name, COUNT(d) FROM Document d GROUP BY d.category.name")
    List<Object[]> countDocumentsByCategory();
}
