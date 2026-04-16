package com.polyhub.controller;

import com.polyhub.dto.CommentDTO;
import com.polyhub.dto.CommentRequestDTO;
import com.polyhub.entity.User;
import com.polyhub.service.CommentService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentRestController {

    @Autowired
    private CommentService commentService;

    // API trả về List bình luận cho 1 Post cụ thể
    @GetMapping("/{postId}")
    public ResponseEntity<List<CommentDTO>> getCommentsByPost(@PathVariable Long postId) {
        try {
            List<CommentDTO> comments = commentService.getCommentsByPostId(postId);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // API thêm bình luận mới
    @PostMapping
    public ResponseEntity<?> addComment(@RequestBody CommentRequestDTO request, java.security.Principal principal) {
        // Authenticate - Kiểm tra thông qua lớp Security (Principal)
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập để bình luận");
        }

        try {
            // Lấy tên username từ Principal
            String username = principal.getName();
            CommentDTO newComment = commentService.addComment(request, username);
            return ResponseEntity.ok(newComment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Đã xảy ra lỗi hệ thống");
        }
    }
}