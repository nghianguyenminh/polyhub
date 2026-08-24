package com.polyhub.controller.api;

import com.polyhub.entity.Post;
import com.polyhub.entity.PostImage;
import com.polyhub.entity.User;
import com.polyhub.entity.Like;
import com.polyhub.repository.LikeRepository;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.PostService;
import com.polyhub.service.PostService.ContentViolationException;
import com.polyhub.service.client.SavedPostService;
import com.polyhub.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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

    @Autowired
    private NotificationService notificationService;

    /**
     * POST /api/v2/posts/create
     * Tạo bài viết mới (có thể kèm ảnh).
     */
    @PostMapping("/create")
    public ResponseEntity<?> createPost(
            @RequestParam("content") String content,
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để đăng bài."));
        }

        try {
            String username = principal.getName();
            Post newPost = postService.createPost(content, images, username);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("postId", newPost.getId());

            // Thông báo phù hợp theo trạng thái kiểm duyệt
            String moderationStatus = newPost.getModerationStatus() != null
                    ? newPost.getModerationStatus().name() : "APPROVED";
            response.put("moderationStatus", moderationStatus);

            if ("PENDING_REVIEW".equals(moderationStatus)) {
                response.put("message", "⏳ Bài viết của bạn đang được đội ngũ PolyHUB xem xét. Bạn sẽ nhận thông báo khi được duyệt. ⏳");
            } else {
                response.put("message", "Đã tạo bài viết thành công!");
                response.put("post", buildPostResponse(newPost, new HashSet<>(), username));
            }

            return ResponseEntity.ok(response);
        } catch (ContentViolationException e) {
            // HTTP 422 Unprocessable Entity: nội dung hợp lệ về kỹ thuật nhưng vi phạm nội quy
            return ResponseEntity.unprocessableEntity()
                    .body(Map.of("error", e.getMessage(), "violationType", "CONTENT_VIOLATION"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/feed")
    public ResponseEntity<?> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {

        String viewerUsername = (principal != null) ? principal.getName() : "";
        Page<Post> postPage = postRepository.findVisiblePostsForFeed(viewerUsername, PageRequest.of(page, size));

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

        if (isLiked) {
            Post post = postRepository.findById(postId).orElse(null);
            if (post != null && post.getUser() != null) {
                notificationService.createNotification(
                        post.getUser().getUsername(),
                        username,
                        "đã thích bài viết của bạn.",
                        "LIKE",
                        postId);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("isLiked", isLiked);
        response.put("likesCount", likesCount);
        return ResponseEntity.ok(response);
    }

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

    private Map<String, Object> buildPostResponse(Post post, Set<Long> savedPostIds) {
        return buildPostResponse(post, savedPostIds, "");
    }

    private Map<String, Object> buildPostResponse(Post post, Set<Long> savedPostIds, String viewerUsername) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId());

        boolean isOwner = post.getUser() != null && post.getUser().getUsername().equals(viewerUsername);
        boolean isHiddenFromUser = Boolean.TRUE.equals(post.getIsPrivate()) && !isOwner;

        if (Boolean.TRUE.equals(post.getIsDeleted())) {
            map.put("content", "Bài viết đã bị xóa");
            map.put("imageUrl", null);
            map.put("imageUrls", new ArrayList<>());
        } else if (isHiddenFromUser) {
            map.put("content", "Bài viết này đã bị ẩn");
            map.put("imageUrl", null);
            map.put("imageUrls", new ArrayList<>());
        } else {
            map.put("content", post.getContent());
            map.put("imageUrl", post.getImageUrl());
            
            List<String> imageUrls = new ArrayList<>();
            if (post.getImages() != null && !post.getImages().isEmpty()) {
                imageUrls = post.getImages().stream()
                        .sorted(Comparator.comparingInt(PostImage::getDisplayOrder))
                        .map(PostImage::getImageUrl)
                        .collect(Collectors.toList());
            } else if (post.getImageUrl() != null && !post.getImageUrl().isEmpty()) {
                imageUrls = List.of(post.getImageUrl());
            }
            map.put("imageUrls", imageUrls);
        }

        map.put("isDeleted", post.getIsDeleted());
        map.put("isPrivate", post.getIsPrivate());
        map.put("createdAt", post.getCreatedAt());
        map.put("isSaved", savedPostIds != null && savedPostIds.contains(post.getId()));

        String moderationStatus = post.getModerationStatus() != null
                ? post.getModerationStatus().name() : "APPROVED";
        map.put("moderationStatus", moderationStatus);
        if (!"APPROVED".equals(moderationStatus)) {
            map.put("moderationCategory", post.getModerationCategory());
        }

        long likesCount = likeRepository.countByPostId(post.getId());
        map.put("likesCount", likesCount);
        boolean isLiked = viewerUsername != null && !viewerUsername.isEmpty()
                && likeRepository.findByPostIdAndUsername(post.getId(), viewerUsername).isPresent();
        map.put("isLiked", isLiked);

        if (post.getUser() != null) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("username", post.getUser().getUsername());
            userMap.put("fullname", post.getUser().getFullname());
            userMap.put("avatar", post.getUser().getAvatar());
            if (post.getUser().getRole() != null) {
                userMap.put("role", Map.of(
                        "id", post.getUser().getRole().getId(),
                        "name", post.getUser().getRole().getName()));
            }
            map.put("user", userMap);
        }

        map.put("commentsCount", post.getComments() != null ? post.getComments().size() : 0);
        map.put("sharesCount", post.getShares() != null ? post.getShares().size() : 0);

        if (post.getSharedPost() != null) {
            Post shared = post.getSharedPost();
            Map<String, Object> sharedMap = new HashMap<>();
            sharedMap.put("id", shared.getId());
            sharedMap.put("createdAt", shared.getCreatedAt());

            boolean isSharedOwner = shared.getUser() != null && shared.getUser().getUsername().equals(viewerUsername);
            boolean isSharedHiddenFromUser = Boolean.TRUE.equals(shared.getIsPrivate()) && !isSharedOwner;

            if (Boolean.TRUE.equals(shared.getIsDeleted())) {
                sharedMap.put("content", "Bài viết đã bị xóa");
                sharedMap.put("imageUrl", null);
                sharedMap.put("imageUrls", new ArrayList<>());
            } else if (isSharedHiddenFromUser) {
                sharedMap.put("content", "Bài viết này đã bị ẩn");
                sharedMap.put("imageUrl", null);
                sharedMap.put("imageUrls", new ArrayList<>());
            } else {
                sharedMap.put("content", shared.getContent());
                sharedMap.put("imageUrl", shared.getImageUrl());
                
                List<String> sharedImageUrls = new ArrayList<>();
                if (shared.getImages() != null && !shared.getImages().isEmpty()) {
                    sharedImageUrls = shared.getImages().stream()
                            .sorted(Comparator.comparingInt(PostImage::getDisplayOrder))
                            .map(PostImage::getImageUrl)
                            .collect(Collectors.toList());
                } else if (shared.getImageUrl() != null && !shared.getImageUrl().isEmpty()) {
                    sharedImageUrls = List.of(shared.getImageUrl());
                }
                sharedMap.put("imageUrls", sharedImageUrls);
            }

            sharedMap.put("isDeleted", shared.getIsDeleted());
            sharedMap.put("isPrivate", shared.getIsPrivate());

            if (shared.getUser() != null) {
                Map<String, Object> sharedUserMap = new HashMap<>();
                sharedUserMap.put("username", shared.getUser().getUsername());
                sharedUserMap.put("fullname", shared.getUser().getFullname());
                sharedUserMap.put("avatar", shared.getUser().getAvatar());
                if (shared.getUser().getRole() != null) {
                    sharedUserMap.put("role", Map.of(
                            "id", shared.getUser().getRole().getId(),
                            "name", shared.getUser().getRole().getName()));
                }
                sharedMap.put("user", sharedUserMap);
            }
            map.put("sharedPost", sharedMap);
        }

        return map;
    }

    /** 
     * PUT /api/v2/posts/{postId}
     * Sửa nội dung bài viết.
     */
    @PutMapping("/{postId}")
    public ResponseEntity<?> updatePost(@PathVariable Long postId,
            @RequestBody Map<String, String> requestBody,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để sửa bài viết."));
        }
        try {
            String newContent = requestBody.get("content");
            if (newContent == null || newContent.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Nội dung bài viết không được để trống."));
            }
            Post updatedPost = postService.updatePost(postId, newContent, principal.getName());
            String moderationStatus = updatedPost.getModerationStatus() != null
                    ? updatedPost.getModerationStatus().name() : "APPROVED";
            String message = "PENDING_REVIEW".equals(moderationStatus)
                    ? "⏳ Nội dung chỉnh sửa đang được xem xét bởi đội ngũ PolyHUB."
                    : "Đã cập nhật bài viết thành công.";
            return ResponseEntity.ok(Map.of("message", message, "moderationStatus", moderationStatus));
        } catch (ContentViolationException e) {
            return ResponseEntity.unprocessableEntity()
                    .body(Map.of("error", e.getMessage(), "violationType", "CONTENT_VIOLATION"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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
            postService.softDeletePost(postId, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Đã xóa bài viết thành công."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

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

    @PostMapping("/{postId}/report")
    public ResponseEntity<?> reportPost(@PathVariable Long postId, @RequestBody Map<String, String> body,
            Principal principal) {
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