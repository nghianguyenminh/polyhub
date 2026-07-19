package com.polyhub.repository;

import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p " +
            "WHERE ((p.isPrivate = false OR p.isPrivate IS NULL) OR p.user.username = :viewerUsername) " +
            "AND (p.isLocked = false OR p.isLocked IS NULL) " +
            "AND (p.isDeleted = false OR p.isDeleted IS NULL) " +
            "ORDER BY " +
            "  CASE " +
            "    WHEN p.user.username = :viewerUsername THEN 1 " +
            "    WHEN p.user.username IN (SELECT f.username FROM User u JOIN u.following f WHERE u.username = :viewerUsername) THEN 1 "
            +
            "    ELSE 0 " +
            "  END DESC, " +
            "  p.hotScore DESC, " +
            "  p.createdAt DESC")
    Page<Post> findVisiblePostsForFeed(@Param("viewerUsername") String viewerUsername, Pageable pageable);

    // Lấy bài ở profile giữ nguyên
    @Query("SELECT p FROM Post p WHERE p.user.username = :username AND (p.isLocked = false OR p.isLocked IS NULL) ORDER BY p.createdAt DESC")

    Page<Post> findByIsLockedTrue(Pageable pageable);

    List<Post> findByUserInOrderByCreatedAtDesc(List<User> users);

    Page<Post> findByUsernameOrderByCreatedAtDesc(@Param("username") String username, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.user IN :users AND (p.isDeleted = false OR p.isDeleted IS NULL) ORDER BY p.createdAt DESC")
    List<Post> findByUserInOrderByCreatedAtDesc(@Param("users") List<User> users);
}
