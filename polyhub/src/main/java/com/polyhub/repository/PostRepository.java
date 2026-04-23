package com.polyhub.repository;

import com.polyhub.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    /**
     * Lấy danh sách bài viết cho trang chủ:
     * - Ưu tiên 1: Bài viết của chính user đang xem HOẶC bài viết của những người mà user đang follow.
     * - Ưu tiên 2: Các bài viết Public khác.
     * - Ở mỗi nhóm ưu tiên, sắp xếp giảm dần theo thời gian tạo (bài mới nhất lên đầu).
     */
    @Query("SELECT p FROM Post p " +
           "WHERE (p.isPrivate = false OR p.isPrivate IS NULL) OR p.user.username = :viewerUsername " +
           "ORDER BY " +
           "  CASE " +
           // Trọng số 1: Nếu bài viết là của chính user đang xem
           "    WHEN p.user.username = :viewerUsername THEN 1 " +
           // Trọng số 1: Nếu tác giả bài viết nằm trong danh sách "following" của user đang xem
           "    WHEN p.user.username IN (SELECT f.username FROM User u JOIN u.following f WHERE u.username = :viewerUsername) THEN 1 " +
           // Trọng số 0: Các bài viết public của người lạ
           "    ELSE 0 " +
           "  END DESC, " +
           // Tiêu chí sắp xếp thứ 2: Thời gian đăng bài
           "  p.createdAt DESC")
    Page<Post> findVisiblePostsForFeed(@Param("viewerUsername") String viewerUsername, Pageable pageable);

    // Lấy bài ở profile giữ nguyên
    @Query("SELECT p FROM Post p WHERE p.user.username = :username ORDER BY p.createdAt DESC")
    Page<Post> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);
}