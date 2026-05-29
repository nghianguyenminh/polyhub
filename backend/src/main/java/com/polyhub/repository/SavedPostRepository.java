package com.polyhub.repository;

import com.polyhub.entity.Post;
import com.polyhub.entity.SavedPost;
import com.polyhub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {
    Page<SavedPost> findByUserOrderBySavedAtDesc(User user, Pageable pageable);
    Optional<SavedPost> findByUserAndPost(User user, Post post);
    boolean existsByUserAndPost(User user, Post post);
}
