package com.polyhub.repository;

import com.polyhub.entity.Document;
import com.polyhub.entity.DocumentStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository
  extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {
  long countByStatus(DocumentStatus status);

  List<Document> findByStatus(DocumentStatus status);

  @Query("SELECT COUNT(d) FROM Document d WHERE d.approved = :approved")
  long countByApproved(@Param("approved") boolean approved);

  List<Document> findByApproved(boolean approved);
}
