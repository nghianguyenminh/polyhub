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
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportApiController {

    private final PostReportRepository postReportRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

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
        PostReport report = postReportRepository.findById(id).orElse(null);
        if (report != null && report.getPost() != null) {
            Post post = report.getPost();
            // Disassociate all reports related to this post before deleting the post
            java.util.List<PostReport> relatedReports = postReportRepository.findByPostId(post.getId());
            for (PostReport r : relatedReports) {
                r.setPost(null);
                r.setStatus("RESOLVED");
                postReportRepository.save(r);
            }
            postRepository.delete(post); 
            return ResponseEntity.ok(Map.of("message", "Đã xóa bài viết vi phạm thành công."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Lỗi xử lý báo cáo."));
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

    @PostMapping("/{id}/warn")
    public ResponseEntity<?> warnUser(@PathVariable Long id) {
        PostReport report = postReportRepository.findById(id).orElse(null);
        if (report != null && report.getPost() != null && report.getPost().getUser() != null) {
            User reportedUser = report.getPost().getUser();
            emailService.sendPostWarningEmail(
                reportedUser.getEmail(), 
                reportedUser.getFullname(), 
                report.getPost().getContent(), 
                report.getReason()
            );
            report.setStatus("WARNED");
            postReportRepository.save(report);
            return ResponseEntity.ok(Map.of("message", "Đã gửi cảnh báo yêu cầu chỉnh sửa/xóa bài viết đến người dùng " + reportedUser.getUsername() + " thành công (Hạn chót 2 ngày)."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Không tìm thấy thông tin báo cáo hoặc người dùng."));
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
                        report.getReason()
                    );
                }
            }
            report.setStatus("LOCK_REQUESTED");
            postReportRepository.save(report);
            return ResponseEntity.ok(Map.of("message", "Đã gửi yêu cầu khóa tài khoản của người dùng " + reportedUser.getUsername() + " đến ban quản lý người dùng thành công."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Không tìm thấy thông tin báo cáo hoặc người dùng."));
    }
}
