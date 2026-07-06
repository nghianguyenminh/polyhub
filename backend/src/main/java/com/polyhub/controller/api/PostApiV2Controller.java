package com.polyhub.controller.api;

import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import com.polyhub.entity.Like;
import com.polyhub.repository.LikeRepository;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.PostService;
import com.polyhub.service.client.SavedPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * REST API V2 cho Feed & Posts — dùng bởi Next.js frontend.
 * Bổ sung cho PostApiController hiện có (tạo/sửa/xóa/share/report bài viết).
 */
@RestController
@RequestMapping("/api/v2/posts")
public class PostApiV2Controller {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SavedPostService savedPostService;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private PostService postService;

    /**
     * POST /api/v2/posts/create
     * Tạo bài viết mới (có thể kèm ảnh).
     */
    @PostMapping("/create")
    public ResponseEntity<?> createPost(
            @RequestParam("content") String content,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để đăng bài."));
        }

        try {
            String username = principal.getName();
            Post newPost = postService.createPost(content, image, username);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã tạo bài viết thành công!");
            response.put("postId", newPost.getId());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/v2/posts/feed?page=0&size=10
     * Lấy feed (ưu tiên bài của following nếu đã đăng nhập).
     */
    @GetMapping("/feed")
    public ResponseEntity<?> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {

        String viewerUsername = (principal != null) ? principal.getName() : "";
        Page<Post> postPage = postRepository.findVisiblePostsForFeed(viewerUsername, PageRequest.of(page, size));

        // Lấy danh sách ID bài đã lưu (nếu đã đăng nhập)
        Set<Long> savedPostIds = new HashSet<>();
        if (principal != null) {
            User user = userRepository.findById(principal.getName()).orElse(null);
            if (user != null) {
                org.springframework.data.domain.Page<com.polyhub.entity.SavedPost> savedPage = savedPostService
                        .getSavedPostsByUser(user, PageRequest.of(0, 99999));
                savedPostIds = savedPage.getContent().stream()
                        .map(sp -> sp.getPost().getId())
                        .collect(Collectors.toSet());
            }
        }

        List<Map<String, Object>> posts = new ArrayList<>();
        for (Post post : postPage.getContent()) {
            posts.add(buildPostResponse(post, savedPostIds, viewerUsername));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("posts", posts);
        response.put("currentPage", postPage.getNumber());
        response.put("totalPages", postPage.getTotalPages());
        response.put("totalElements", postPage.getTotalElements());
        response.put("hasNext", postPage.hasNext());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v2/posts/user/{username}?page=0&size=10
     * Lấy bài viết của một user cụ thể (profile).
     */
    @GetMapping("/user/{username}")
    public ResponseEntity<?> getUserPosts(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {

        Page<Post> postPage = postRepository.findByUsernameOrderByCreatedAtDesc(username, PageRequest.of(page, size));

        Set<Long> savedPostIds = new HashSet<>();
        if (principal != null) {
            User user = userRepository.findById(principal.getName()).orElse(null);
            if (user != null) {
                org.springframework.data.domain.Page<com.polyhub.entity.SavedPost> savedPage = savedPostService
                        .getSavedPostsByUser(user, PageRequest.of(0, 99999));
                savedPostIds = savedPage.getContent().stream()
                        .map(sp -> sp.getPost().getId())
                        .collect(Collectors.toSet());
            }
        }

        List<Map<String, Object>> posts = new ArrayList<>();
        for (Post post : postPage.getContent()) {
            posts.add(buildPostResponse(post, savedPostIds, principal != null ? principal.getName() : ""));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("posts", posts);
        response.put("currentPage", postPage.getNumber());
        response.put("totalPages", postPage.getTotalPages());
        response.put("totalElements", postPage.getTotalElements());

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v2/posts/{postId}/like
     * Toggle like vào MongoDB để trạng thái còn sau khi reload.
     */
    @PostMapping("/{postId}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long postId, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để thích bài viết."));
        }

        String username = principal.getName();
        boolean isLiked;

        Optional<Like> existingLike = likeRepository.findByPostIdAndUsername(postId, username);
        if (existingLike.isPresent()) {
            likeRepository.deleteByPostIdAndUsername(postId, username);
            isLiked = false;
        } else {
            Like newLike = Like.builder()
                    .postId(postId)
                    .username(username)
                    .createdAt(LocalDateTime.now())
                    .build();
            likeRepository.save(newLike);
            isLiked = true;
        }

        long likesCount = likeRepository.countByPostId(postId);
        Map<String, Object> response = new HashMap<>();
        response.put("isLiked", isLiked);
        response.put("likesCount", likesCount);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v2/posts/{postId}/like
     * Lấy trạng thái like hiện tại từ MongoDB.
     */
    @GetMapping("/{postId}/like")
    public ResponseEntity<?> getLikeStatus(@PathVariable Long postId, Principal principal) {
        long likesCount = likeRepository.countByPostId(postId);
        boolean isLiked = principal != null
                && likeRepository.findByPostIdAndUsername(postId, principal.getName()).isPresent();

        Map<String, Object> response = new HashMap<>();
        response.put("likesCount", likesCount);
        response.put("isLiked", isLiked);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v2/posts/{postId}/share
     * Chia sẻ bài viết lên trang cá nhân.
     */
    @PostMapping("/{postId}/share")
    public ResponseEntity<?> sharePost(@PathVariable Long postId,
                                       @RequestBody Map<String, String> requestBody,
                                       Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để chia sẻ bài viết."));
        }

        try {
            String username = principal.getName();
            String caption = requestBody.get("content");

            Post newSharedPost = postService.sharePost(postId, caption, username);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Đã chia sẻ bài viết lên trang cá nhân!");
            result.put("sharedPostId", newSharedPost.getId());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== Helper =====

    private Map<String, Object> buildPostResponse(Post post, Set<Long> savedPostIds) {
        return buildPostResponse(post, savedPostIds, "");
    }

    private Map<String, Object> buildPostResponse(Post post, Set<Long> savedPostIds, String viewerUsername) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId());
        map.put("content", post.getContent());
        map.put("imageUrl", post.getImageUrl());
        map.put("isPrivate", post.getIsPrivate());
        map.put("createdAt", post.getCreatedAt());
        map.put("isSaved", savedPostIds.contains(post.getId()));

        // Like info
        long likesCount = likeRepository.countByPostId(post.getId());
        map.put("likesCount", likesCount);
        boolean isLiked = !viewerUsername.isEmpty()
                && likeRepository.findByPostIdAndUsername(post.getId(), viewerUsername).isPresent();
        map.put("isLiked", isLiked);

        // User info
        if (post.getUser() != null) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("username", post.getUser().getUsername());
            userMap.put("fullname", post.getUser().getFullname());
            userMap.put("avatar", post.getUser().getAvatar());
            if (post.getUser().getRole() != null) {
                userMap.put("role", Map.of(
                    "id", post.getUser().getRole().getId(),
                    "name", post.getUser().getRole().getName()
                ));
            }
            map.put("user", userMap);
        }

        // Comments count
        map.put("commentsCount", post.getComments() != null ? post.getComments().size() : 0);

        // Shares count
        map.put("sharesCount", post.getShares() != null ? post.getShares().size() : 0);

        // Shared post (nếu đây là bài share)
        if (post.getSharedPost() != null) {
            Post shared = post.getSharedPost();
            Map<String, Object> sharedMap = new HashMap<>();
            sharedMap.put("id", shared.getId());
            sharedMap.put("content", shared.getContent());
            sharedMap.put("imageUrl", shared.getImageUrl());
            sharedMap.put("createdAt", shared.getCreatedAt());
            if (shared.getUser() != null) {
                Map<String, Object> sharedUserMap = new HashMap<>();
                sharedUserMap.put("username", shared.getUser().getUsername());
                sharedUserMap.put("fullname", shared.getUser().getFullname());
                sharedUserMap.put("avatar", shared.getUser().getAvatar());
                if (shared.getUser().getRole() != null) {
                    sharedUserMap.put("role", Map.of(
                        "id", shared.getUser().getRole().getId(),
                        "name", shared.getUser().getRole().getName()
                    ));
                }
                sharedMap.put("user", sharedUserMap);
            }
            map.put("sharedPost", sharedMap);
        }

        return map;
    }

    /**
     * DELETE /api/v2/posts/{postId}
     * Xóa bài viết hiện tại.
     */
    @DeleteMapping("/{postId}")
    public ResponseEntity<Map<String, Object>> deletePost(@PathVariable Long postId, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để xóa bài viết."));
        }
        try {
            postService.deletePost(postId, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Đã xóa bài viết thành công."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PATCH /api/v2/posts/{postId}/privacy
     * Đổi chế độ công khai / chỉ mình tôi.
     */
    @PatchMapping("/{postId}/privacy")
    public ResponseEntity<?> togglePrivacy(@PathVariable Long postId, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để đổi quyền riêng tư."));
        }
        try {
            com.polyhub.entity.Post updated = postService.togglePrivacy(postId, principal.getName());
            boolean isPrivate = updated.getIsPrivate() != null ? updated.getIsPrivate() : false;
            String status = isPrivate ? "riêng tư (Chỉ mình tôi)" : "công khai";
            return ResponseEntity.ok(Map.of("message", "Đã đổi chế độ " + status, "isPrivate", isPrivate));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/v2/posts/{postId}/report
     * Gửi báo cáo vi phạm bài viết tới admin.
     */
    @PostMapping("/{postId}/report")
    public ResponseEntity<?> reportPost(@PathVariable Long postId, @RequestBody Map<String, String> body, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để báo cáo bài viết."));
        }
        String reason = body.get("reason");
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lý do báo cáo không được để trống."));
        }
        try {
            postService.reportPost(postId, reason, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Cảm ơn bạn đã báo cáo. Quản trị viên sẽ xem xét sớm."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
