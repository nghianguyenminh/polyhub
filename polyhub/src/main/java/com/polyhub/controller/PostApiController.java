package com.polyhub.controller;

import com.polyhub.entity.Post;
import com.polyhub.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostApiController {

    @Autowired
    private PostService postService;

    @PostMapping("/create")
    public ResponseEntity<?> createPost(
            @RequestParam("content") String content,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        try {
            // Lấy ID người dùng đang đăng nhập (hoặc dùng mặc định nếu chưa đăng nhập)
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals("anonymousUser"))
                    ? authentication.getName() 
                    : "demo_user"; // Dummy account

            Post newPost = postService.createPost(content, image, username);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã tạo bài viết thành công!");
            response.put("post", newPost);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Đã xảy ra lỗi khi đăng bài: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || authentication.getName().equals("anonymousUser")) {
                return ResponseEntity.status(401).body("Yêu cầu đăng nhập");
            }
            
            Post post = postService.getPostById(id).orElse(null);
            if (post == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Xóa bài viết (Quyền thuộc sở hữu bài viết)
            if (!post.getUser().getUsername().equals(authentication.getName())) {
                return ResponseEntity.status(403).body("Không có quyền xóa bài viết của người khác");
            }

            postService.deletePost(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi khi xóa bài: " + e.getMessage());
        }
    }
}