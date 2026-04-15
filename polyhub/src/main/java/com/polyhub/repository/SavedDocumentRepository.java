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

    Page<SavedDocument> findByUserOrderBySavedAtDesc(User user, Pageable pageable);

    Optional<SavedDocument> findByUserAndDocument(User user, Document document);

    long countByUser(User user);
}
