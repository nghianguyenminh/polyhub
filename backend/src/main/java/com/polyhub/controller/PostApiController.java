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

import java.security.Principal;

@RestController
@RequestMapping("/api/posts")
public class PostApiController {

    @Autowired
    private PostService postService;

    // ... createPost
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

    // --- API Chia sẻ bài viết (Share) ---
    @PostMapping("/{postId}/share")
    public ResponseEntity<?> sharePost(@PathVariable Long postId, @RequestBody Map<String, String> requestBody, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Vui lòng đăng nhập để thực hiện chức năng này.");
        }

        try {
            String username = principal.getName();
            String caption = requestBody.get("content"); // Nội dung chú thích thêm

            Post newSharedPost = postService.sharePost(postId, caption, username);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã chia sẻ bài viết lên trang cá nhân!");
            // Trả về một ID để test, tránh bóc tách Entity trực tiếp gây lỗi Jackson Đệ quy
            response.put("sharedPostId", newSharedPost.getId());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- API Chỉnh sửa bài viết ---
    @PutMapping("/{postId}")
    public ResponseEntity<?> updatePost(@PathVariable Long postId, @RequestBody Map<String, String> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Chưa đăng nhập");
        try {
            String newContent = payload.get("content");
            postService.updatePost(postId, newContent, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Cập nhật bài viết thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- API Xóa bài viết ---
    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Chưa đăng nhập");
        try {
            postService.deletePost(postId, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Đã xóa bài viết"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- API Chuyển đổi quyền riêng tư (Public/Private) ---
    @PatchMapping("/{postId}/privacy")
    public ResponseEntity<?> togglePrivacy(@PathVariable Long postId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Chưa đăng nhập");
        try {
            Post updatedPost = postService.togglePrivacy(postId, principal.getName());
            String status = updatedPost.getIsPrivate() ? "riêng tư (Chỉ mình tôi)" : "công khai";
            return ResponseEntity.ok(Map.of("message", "Đã đổi bài viết sang chế độ " + status, "isPrivate", updatedPost.getIsPrivate()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- API Báo cáo bài viết ---
    @PostMapping("/{postId}/report")
    public ResponseEntity<?> reportPost(@PathVariable Long postId, @RequestBody Map<String, String> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Chưa đăng nhập");
        try {
            String reason = payload.get("reason");
            postService.reportPost(postId, reason, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Cảm ơn bạn đã báo cáo. Quản trị viên sẽ xử lý sớm."));
        } catch (RuntimeException e) { // Bắt lỗi Logic chống Report
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi hệ thống");
        }
    }
}