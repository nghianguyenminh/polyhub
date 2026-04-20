package com.polyhub.repository;

import com.polyhub.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
<<<<<<< HEAD

    // Method to find posts by a specific user, ordered by creation date descending
    Page<Post> findByUser_UsernameOrderByCreatedAtDesc(String username, Pageable pageable);
=======
    
    // Ở trang chủ (Tất cả mọi người): Lấy những bài Public hoặc là bài của chính user đang xem
    @Query("SELECT p FROM Post p WHERE (p.isPrivate = false OR p.isPrivate IS NULL) OR p.user.username = :viewerUsername ORDER BY p.createdAt DESC")
    Page<Post> findVisiblePostsForFeed(String viewerUsername, Pageable pageable);

    // Lấy bài ở profile, cũng cần điều kiện này nếu là Profile của người khác. (Cho hiện tại thì chỉ hỗ trợ xem chính mình nên giữ nguyên, nhưng sẽ update sau).
    @Query("SELECT p FROM Post p WHERE p.user.username = :username ORDER BY p.createdAt DESC")
    Page<Post> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);
<<<<<<< HEAD
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
}