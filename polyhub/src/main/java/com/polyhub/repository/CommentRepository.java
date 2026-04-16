package com.polyhub.repository;

import com.polyhub.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    // Lấy tất cả bình luận gốc của 1 bài viết (không lấy các lượt reply) - sắp xếp từ cũ nhất đến mới nhất
    List<Comment> findByPostIdAndParentCommentIsNullOrderByCreatedAtAsc(Long postId);

    // Lấy tất cả lượt reply của 1 bình luận cha - sắp xếp từ cũ nhất đến mới nhất
    List<Comment> findByParentCommentIdOrderByCreatedAtAsc(Long parentId);
    
    // Tính tổng số bình luận của 1 bài viết
    long countByPostId(Long postId);
}
