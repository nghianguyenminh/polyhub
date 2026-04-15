package com.polyhub.repository;

import com.polyhub.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // Method to find posts by a specific user, ordered by creation date descending
    Page<Post> findByUser_UsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    // You can add more custom query methods here as needed
}
