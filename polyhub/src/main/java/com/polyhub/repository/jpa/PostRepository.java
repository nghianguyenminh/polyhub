package com.polyhub.repository.jpa;

import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // Ở trang chủ (Tất cả mọi người): Lấy những bài Public hoặc là bài của chính user đang xem
    @Query("SELECT p FROM Post p WHERE (p.isPrivate = false OR p.isPrivate IS NULL) OR p.user.username = :viewerUsername ORDER BY p.createdAt DESC")
    Page<Post> findVisiblePostsForFeed(String viewerUsername, Pageable pageable);

    // Lấy bài ở profile, cũng cần điều kiện này nếu là Profile của người khác. (Cho hiện tại thì chỉ hỗ trợ xem chính mình nên giữ nguyên, nhưng sẽ update sau).
    @Query("SELECT p FROM Post p WHERE p.user.username = :username ORDER BY p.createdAt DESC")
    Page<Post> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    List<Post> findByUserInOrderByCreatedAtDesc(List<User> users);
}
