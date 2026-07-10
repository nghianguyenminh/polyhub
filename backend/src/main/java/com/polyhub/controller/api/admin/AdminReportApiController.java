package com.polyhub.controller.api.admin;

import com.polyhub.entity.Post;
import com.polyhub.entity.PostReport;
import com.polyhub.entity.User;
import com.polyhub.repository.PostReportRepository;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import com.polyhub.service.NotificationService;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')")
public class AdminReportApiController {

    private final PostReportRepository postReportRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    @jakarta.annotation.PostConstruct
    public void initDatabaseSchema() {
        try {
            jdbcTemplate.execute("ALTER TABLE post_reports MODIFY post_id BIGINT NULL");
        } catch (Exception e) {
            System.err.println("Database migration note: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getReports(@RequestParam(defaultValue = "1") int page) {
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PostReport> reportPage = postReportRepository.findByStatusIn(
            java.util.List.of("PENDING", "WARNED", "LOCK_REQUESTED"),
            pageable
        );
        
        long pendingCount = postReportRepository.countByStatus("PENDING") +
                             postReportRepository.countByStatus("WARNED") +
                             postReportRepository.countByStatus("LOCK_REQUESTED");
        long resolvedCount = postReportRepository.countByStatus("RESOLVED");
        long falseCount = postReportRepository.countByStatus("REJECTED");

        // Build response manually to avoid lazy-loading serialization errors
        java.util.List<Map<String, Object>> reportList = new java.util.ArrayList<>();
        for (PostReport r : reportPage.getContent()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("reason", r.getReason());
            item.put("status", r.getStatus() != null ? r.getStatus() : "PENDING");
            item.put("createdAt", r.getCreatedAt());

            // Post info
            if (r.getPost() != null) {
                Map<String, Object> postMap = new HashMap<>();
                postMap.put("id", r.getPost().getId());
                postMap.put("content", r.getPost().getContent());
                postMap.put("imageUrl", r.getPost().getImageUrl());
                postMap.put("createdAt", r.getPost().getCreatedAt());
                if (r.getPost().getUser() != null) {
                    Map<String, Object> postUser = new HashMap<>();
                    postUser.put("username", r.getPost().getUser().getUsername());
                    postUser.put("fullname", r.getPost().getUser().getFullname());
                    postUser.put("avatar", r.getPost().getUser().getAvatar());
                    postUser.put("email", r.getPost().getUser().getEmail());
                    postMap.put("user", postUser);
                }
                item.put("post", postMap);
            }

            // Reporter info
            if (r.getReporter() != null) {
                Map<String, Object> reporterMap = new HashMap<>();
                reporterMap.put("username", r.getReporter().getUsername());
                reporterMap.put("fullname", r.getReporter().getFullname());
                item.put("reporter", reporterMap);
            }

            reportList.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("reports", reportList);
        response.put("currentPage", page);
        response.put("totalPages", reportPage.getTotalPages());
        response.put("pendingCount", pendingCount);
        response.put("resolvedCount", resolvedCount);
        response.put("falseCount", falseCount);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveReport(@PathVariable Long id) {
        try {
            PostReport report = postReportRepository.findById(id).orElse(null);
            if (report != null && report.getPost() != null) {
                Post post = report.getPost();
                post.setIsLocked(true);
                postRepository.save(post);
                
                java.util.List<PostReport> relatedReports = postReportRepository.findByPostId(post.getId());
                for (PostReport r : relatedReports) {
                    r.setStatus("RESOLVED");
                    postReportRepository.save(r);
                }
                
                notificationService.createNotification(
                    post.getUser().getUsername(),
                    null,
                    "Bài viết của bạn đã bị khóa bởi Quản trị viên do vi phạm quy chuẩn cộng đồng.",
                    "SYSTEM",
                    post.getId()
                );

                return ResponseEntity.ok(Map.of("message", "Đã khóa bài viết vi phạm thành công."));
            }
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi xử lý báo cáo."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectReport(@PathVariable Long id) {
        PostReport report = postReportRepository.findById(id).orElse(null);
        if (report != null) {
            report.setStatus("REJECTED");
            postReportRepository.save(report);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối báo cáo."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Lỗi từ chối báo cáo."));
    }

    @GetMapping("/locked")
    public ResponseEntity<?> getLockedPosts(@RequestParam(defaultValue = "1") int page) {
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Post> lockedPage = postRepository.findByIsLockedTrue(pageable);
        
        List<Map<String, Object>> posts = new ArrayList<>();
        for (Post post : lockedPage.getContent()) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", post.getId());
            map.put("content", post.getContent());
            map.put("imageUrl", post.getImageUrl());
            map.put("createdAt", post.getCreatedAt());
            if (post.getUser() != null) {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("username", post.getUser().getUsername());
                userMap.put("fullname", post.getUser().getFullname());
                userMap.put("avatar", post.getUser().getAvatar());
                map.put("user", userMap);
            }
            posts.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("posts", posts);
        response.put("currentPage", page);
        response.put("totalPages", lockedPage.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/posts/{postId}/unlock")
    public ResponseEntity<?> unlockPost(@PathVariable Long postId) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post != null) {
            post.setIsLocked(false);
            postRepository.save(post);
            
            // Gửi thông báo hệ thống cho chủ bài viết
            notificationService.createNotification(
                post.getUser().getUsername(),
                null,
                "Bài viết của bạn đã được mở khóa bởi Quản trị viên.",
                "SYSTEM",
                post.getId()
            );
            
            return ResponseEntity.ok(Map.of("message", "Đã mở khóa bài viết thành công."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Không tìm thấy bài viết."));
    }
}
