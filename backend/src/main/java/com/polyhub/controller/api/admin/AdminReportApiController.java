package com.polyhub.controller.api.admin;

import com.polyhub.entity.DocumentReport;
import com.polyhub.entity.Post;
import com.polyhub.entity.PostReport;
import com.polyhub.entity.ReportReason;
import com.polyhub.entity.ReportStatus;
import com.polyhub.entity.User;
import com.polyhub.repository.DocumentReportRepository;
import com.polyhub.repository.PostReportRepository;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.EmailService;
import com.polyhub.service.admin.DocumentAdminService;
import com.polyhub.service.NotificationService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN', 'CONTENT_ADMIN')")
public class AdminReportApiController {

    private final PostReportRepository postReportRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final DocumentReportRepository documentReportRepository;
    private final DocumentAdminService documentAdminService;
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
        // ===== Lấy toàn bộ báo cáo bài viết đang cần theo dõi =====
        List<PostReport> postReports = postReportRepository.findByStatusInUnpaged(
                java.util.List.of("PENDING", "WARNED", "LOCK_REQUESTED"));

        // ===== Lấy toàn bộ báo cáo tài liệu đang chờ xử lý =====
        List<DocumentReport> docReports = documentReportRepository.findByStatusInWithDetails(
                java.util.List.of(ReportStatus.PENDING));

        // ===== Build từng item, gộp chung 1 danh sách =====
        java.util.List<Map<String, Object>> merged = new java.util.ArrayList<>();

        for (PostReport r : postReports) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("type", "POST");
            item.put("reason", r.getReason());
            item.put("status", r.getStatus() != null ? r.getStatus() : "PENDING");
            item.put("createdAt", r.getCreatedAt());
            item.put("createdAtRaw", r.getCreatedAt());

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

            if (r.getReporter() != null) {
                Map<String, Object> reporterMap = new HashMap<>();
                reporterMap.put("username", r.getReporter().getUsername());
                reporterMap.put("fullname", r.getReporter().getFullname());
                item.put("reporter", reporterMap);
            }

            merged.add(item);
        }

        for (DocumentReport r : docReports) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("type", "DOCUMENT");
            item.put("reason", reasonLabel(r.getReason()));
            item.put("detail", r.getDetail());
            item.put("status", r.getStatus() != null ? r.getStatus().name() : "PENDING");
            item.put("createdAt", r.getCreatedAt());
            item.put("createdAtRaw", r.getCreatedAt());

            if (r.getDocument() != null) {
                Map<String, Object> docMap = new HashMap<>();
                docMap.put("id", r.getDocument().getId());
                docMap.put("title", r.getDocument().getTitle());
                docMap.put("documentType", r.getDocument().getDocumentType());
                if (r.getDocument().getUploader() != null) {
                    Map<String, Object> uploaderMap = new HashMap<>();
                    uploaderMap.put("username", r.getDocument().getUploader().getUsername());
                    uploaderMap.put("fullname", r.getDocument().getUploader().getFullname());
                    uploaderMap.put("avatar", r.getDocument().getUploader().getAvatar());
                    docMap.put("user", uploaderMap);
                }
                item.put("document", docMap);
            }

            if (r.getReporter() != null) {
                Map<String, Object> reporterMap = new HashMap<>();
                reporterMap.put("username", r.getReporter().getUsername());
                reporterMap.put("fullname", r.getReporter().getFullname());
                item.put("reporter", reporterMap);
            }

            merged.add(item);
        }

        // ===== Sắp xếp mới nhất lên đầu =====
        merged.sort((a, b) -> {
            java.time.LocalDateTime ta = (java.time.LocalDateTime) a.get("createdAtRaw");
            java.time.LocalDateTime tb = (java.time.LocalDateTime) b.get("createdAtRaw");
            if (ta == null || tb == null)
                return 0;
            return tb.compareTo(ta);
        });

        // ===== Phân trang thủ công (10 dòng/trang, giữ đúng size cũ) =====
        int size = 10;
        int total = merged.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min((page - 1) * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        java.util.List<Map<String, Object>> reportList = new java.util.ArrayList<>(merged.subList(fromIndex, toIndex));
        reportList.forEach(m -> m.remove("createdAtRaw"));

        // ===== Số liệu tổng (post + document) =====
        long pendingCount = postReportRepository.countByStatus("PENDING") +
                postReportRepository.countByStatus("WARNED") +
                postReportRepository.countByStatus("LOCK_REQUESTED") +
                documentReportRepository.countByStatus(ReportStatus.PENDING);
        long resolvedCount = postReportRepository.countByStatus("RESOLVED") +
                documentReportRepository.countByStatus(ReportStatus.RESOLVED);
        long falseCount = postReportRepository.countByStatus("REJECTED") +
                documentReportRepository.countByStatus(ReportStatus.DISMISSED);

        Map<String, Object> response = new HashMap<>();
        response.put("reports", reportList);
        response.put("currentPage", page);
        response.put("totalPages", totalPages);
        response.put("pendingCount", pendingCount);
        response.put("resolvedCount", resolvedCount);
        response.put("falseCount", falseCount);

        return ResponseEntity.ok(response);
    }

    private String reasonLabel(ReportReason reason) {
        if (reason == null)
            return "";
        return switch (reason) {
            case COPYRIGHT -> "Vi phạm bản quyền / sở hữu trí tuệ";
            case FAKE_CONTENT -> "Nội dung sai lệch, giả mạo";
            case INAPPROPRIATE -> "Nội dung nhạy cảm, phản cảm";
            case SPAM -> "Spam / quảng cáo trái phép";
            case DUPLICATE -> "Tài liệu trùng lặp";
            case OTHER -> "Lý do khác";
        };
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')")
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

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')")
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

    @PostMapping("/{id}/warn")
    public ResponseEntity<?> warnUser(@PathVariable Long id) {
        PostReport report = postReportRepository.findById(id).orElse(null);
        if (report != null && report.getPost() != null && report.getPost().getUser() != null) {
            User reportedUser = report.getPost().getUser();
            emailService.sendPostWarningEmail(
                    reportedUser.getEmail(),
                    reportedUser.getFullname(),
                    report.getPost().getContent(),
                    report.getReason());
            report.setStatus("WARNED");
            postReportRepository.save(report);
            return ResponseEntity.ok(Map.of("message", "Đã gửi cảnh báo yêu cầu chỉnh sửa/xóa bài viết đến người dùng "
                    + reportedUser.getUsername() + " thành công (Hạn chót 2 ngày)."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Lỗi gửi cảnh báo."));
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

    @PostMapping("/{id}/request-lock")
    public ResponseEntity<?> requestLock(@PathVariable Long id) {
        PostReport report = postReportRepository.findById(id).orElse(null);
        if (report != null && report.getPost() != null && report.getPost().getUser() != null) {
            User reportedUser = report.getPost().getUser();
            java.util.List<User> managers = userRepository.findUserManagers();
            if (managers != null && !managers.isEmpty()) {
                for (User manager : managers) {
                    emailService.sendLockRequestEmail(
                            manager.getEmail(),
                            manager.getFullname(),
                            reportedUser.getFullname(),
                            reportedUser.getUsername(),
                            report.getPost().getContent(),
                            report.getReason());
                }
            }
            report.setStatus("LOCK_REQUESTED");
            postReportRepository.save(report);
            return ResponseEntity.ok(Map.of("message", "Đã gửi yêu cầu khóa tài khoản của người dùng "
                    + reportedUser.getUsername() + " đến ban quản lý người dùng thành công."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Lỗi gửi yêu cầu khóa."));
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

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')")
    @PostMapping("/documents/{id}/resolve")
    public ResponseEntity<?> resolveDocumentReport(@PathVariable Long id) {
        try {
            DocumentReport report = documentReportRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo"));

            report.setStatus(ReportStatus.RESOLVED);
            report.setResolvedAt(LocalDateTime.now());
            documentReportRepository.save(report);

            String reason = "Tài liệu bị báo cáo vi phạm: " + reasonLabel(report.getReason());
            documentAdminService.rejectOrTakedownDocument(report.getDocument().getId(), reason);

            return ResponseEntity.ok(Map.of("message", "Đã gỡ tài liệu vi phạm thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')")
    @PostMapping("/documents/{id}/dismiss")
    public ResponseEntity<?> dismissDocumentReport(@PathVariable Long id) {
        DocumentReport report = documentReportRepository.findById(id).orElse(null);
        if (report != null) {
            report.setStatus(ReportStatus.DISMISSED);
            report.setResolvedAt(LocalDateTime.now());
            documentReportRepository.save(report);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối báo cáo tài liệu này."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Lỗi từ chối báo cáo."));
    }
}
