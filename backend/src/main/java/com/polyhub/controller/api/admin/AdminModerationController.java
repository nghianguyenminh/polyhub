package com.polyhub.controller.api.admin;

import com.polyhub.entity.ModerationStatus;
import com.polyhub.entity.Post;
import com.polyhub.repository.PostRepository;
import com.polyhub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * API cho Admin xem xét và duyệt/từ chối các bài viết đang ở trạng thái PENDING_REVIEW.
 * Endpoint: /api/admin/moderation
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/moderation")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')")
public class AdminModerationController {

    private final PostRepository postRepository;
    private final NotificationService notificationService;

    /**
     * GET /api/admin/moderation/pending
     * Lấy danh sách bài viết đang chờ Admin duyệt.
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<Post> pendingPage = postRepository.findByModerationStatusOrderByCreatedAtDesc(
                ModerationStatus.PENDING_REVIEW,
                PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt")));

        List<Map<String, Object>> items = new ArrayList<>();
        for (Post post : pendingPage.getContent()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", post.getId());
            item.put("content", post.getContent());
            item.put("createdAt", post.getCreatedAt());
            item.put("moderationCategory", post.getModerationCategory());
            item.put("moderationReason", post.getModerationReason());
            item.put("imageUrl", post.getImageUrl());
            if (post.getUser() != null) {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("username", post.getUser().getUsername());
                userMap.put("fullname", post.getUser().getFullname());
                userMap.put("avatar", post.getUser().getAvatar());
                item.put("user", userMap);
            }
            items.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("posts", items);
        response.put("currentPage", pendingPage.getNumber());
        response.put("totalPages", pendingPage.getTotalPages());
        response.put("totalElements", pendingPage.getTotalElements());
        response.put("hasNext", pendingPage.hasNext());

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/admin/moderation/{postId}/approve
     * Admin duyệt bài — chuyển PENDING_REVIEW → APPROVED, bỏ isPrivate.
     */
    @PostMapping("/{postId}/approve")
    public ResponseEntity<?> approvePost(@PathVariable Long postId, Principal principal) {
        return postRepository.findById(postId).map(post -> {
            if (post.getModerationStatus() != ModerationStatus.PENDING_REVIEW) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Bài viết không ở trạng thái PENDING_REVIEW."));
            }
            post.setModerationStatus(ModerationStatus.APPROVED);
            post.setModerationReason(null);
            post.setIsPrivate(false); // Hiển thị lại trên feed
            postRepository.save(post);

            log.info("[Moderation] Admin={} APPROVED postId={}", principal.getName(), postId);

            // Gửi thông báo cho chủ bài viết
            if (post.getUser() != null) {
                notificationService.createNotification(
                        post.getUser().getUsername(),
                        "system",
                        "Bài viết của bạn đã được duyệt và hiển thị công khai. ✅",
                        "MODERATION",
                        postId);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Đã duyệt bài viết thành công.",
                    "postId", postId));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/admin/moderation/{postId}/reject
     * Admin từ chối bài — chuyển PENDING_REVIEW → REJECTED.
     * Body: { "reason": "Lý do từ chối" }
     */
    @PostMapping("/{postId}/reject")
    public ResponseEntity<?> rejectPost(
            @PathVariable Long postId,
            @RequestBody Map<String, String> body,
            Principal principal) {

        String reason = body.getOrDefault("reason", "Vi phạm nội quy cộng đồng PolyHUB.");

        return postRepository.findById(postId).map(post -> {
            if (post.getModerationStatus() != ModerationStatus.PENDING_REVIEW) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Bài viết không ở trạng thái PENDING_REVIEW."));
            }
            post.setModerationStatus(ModerationStatus.REJECTED);
            post.setModerationReason(reason);
            post.setIsDeleted(true); // Xóa mềm — không hiển thị
            postRepository.save(post);

            log.info("[Moderation] Admin={} REJECTED postId={} reason={}", principal.getName(), postId, reason);

            // Gửi thông báo cảnh báo cho chủ bài viết
            if (post.getUser() != null) {
                notificationService.createNotification(
                        post.getUser().getUsername(),
                        "system",
                        "Bài viết của bạn đã bị từ chối vì: " + reason + " ⚠️",
                        "MODERATION",
                        postId);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Đã từ chối bài viết.",
                    "postId", postId,
                    "reason", reason));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/admin/moderation/stats
     * Thống kê kiểm duyệt: tổng theo từng trạng thái.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getModerationStats() {
        long pendingCount = postRepository.countByModerationStatus(ModerationStatus.PENDING_REVIEW);
        long rejectedCount = postRepository.countByModerationStatus(ModerationStatus.REJECTED);
        long approvedCount = postRepository.countByModerationStatus(ModerationStatus.APPROVED);

        return ResponseEntity.ok(Map.of(
                "pending", pendingCount,
                "rejected", rejectedCount,
                "approved", approvedCount,
                "total", pendingCount + rejectedCount + approvedCount));
    }
}
