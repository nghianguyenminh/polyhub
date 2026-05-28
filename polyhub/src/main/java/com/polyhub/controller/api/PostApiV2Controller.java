package com.polyhub.controller.api;

import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.client.SavedPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
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
                org.springframework.data.domain.Page<com.polyhub.entity.SavedPost> savedPage =
                        savedPostService.getSavedPostsByUser(user, PageRequest.of(0, 99999));
                savedPostIds = savedPage.getContent().stream()
                        .map(sp -> sp.getPost().getId())
                        .collect(Collectors.toSet());
            }
        }

        List<Map<String, Object>> posts = new ArrayList<>();
        for (Post post : postPage.getContent()) {
            posts.add(buildPostResponse(post, savedPostIds));
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
                org.springframework.data.domain.Page<com.polyhub.entity.SavedPost> savedPage =
                        savedPostService.getSavedPostsByUser(user, PageRequest.of(0, 99999));
                savedPostIds = savedPage.getContent().stream()
                        .map(sp -> sp.getPost().getId())
                        .collect(Collectors.toSet());
            }
        }

        List<Map<String, Object>> posts = new ArrayList<>();
        for (Post post : postPage.getContent()) {
            posts.add(buildPostResponse(post, savedPostIds));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("posts", posts);
        response.put("currentPage", postPage.getNumber());
        response.put("totalPages", postPage.getTotalPages());
        response.put("totalElements", postPage.getTotalElements());

        return ResponseEntity.ok(response);
    }

    // ===== Helper =====

    private Map<String, Object> buildPostResponse(Post post, Set<Long> savedPostIds) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", post.getId());
        map.put("content", post.getContent());
        map.put("imageUrl", post.getImageUrl());
        map.put("isPrivate", post.getIsPrivate());
        map.put("createdAt", post.getCreatedAt());
        map.put("isSaved", savedPostIds.contains(post.getId()));

        // User info
        if (post.getUser() != null) {
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("username", post.getUser().getUsername());
            userMap.put("fullname", post.getUser().getFullname());
            userMap.put("avatar", post.getUser().getAvatar());
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
                sharedMap.put("user", sharedUserMap);
            }
            map.put("sharedPost", sharedMap);
        }

        return map;
    }
}
