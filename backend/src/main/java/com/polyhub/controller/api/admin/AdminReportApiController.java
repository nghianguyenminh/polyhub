package com.polyhub.controller.api.admin;

import com.polyhub.entity.Post;
import com.polyhub.entity.PostReport;
import com.polyhub.entity.User;
import com.polyhub.repository.PostReportRepository;
import com.polyhub.repository.PostRepository;
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

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')")
public class AdminReportApiController {

    private final PostReportRepository postReportRepository;
    private final PostRepository postRepository;
    private final EmailService emailService;

    @GetMapping
    public ResponseEntity<?> getReports(@RequestParam(defaultValue = "1") int page) {
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PostReport> reportPage = postReportRepository.findAll(pageable);
        
        long pendingCount = postReportRepository.count();
        long resolvedCount = 0;
        long falseCount = 0;

        Map<String, Object> response = new HashMap<>();
        response.put("reports", reportPage.getContent());
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
            postRepository.delete(post); 
            return ResponseEntity.ok(Map.of("message", "Đã xóa bài viết vi phạm thành công."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Lỗi xử lý báo cáo."));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectReport(@PathVariable Long id) {
        if (postReportRepository.existsById(id)) {
            postReportRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối báo cáo."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Lỗi từ chối báo cáo."));
    }

    @PostMapping("/{id}/warn")
    public ResponseEntity<?> warnUser(@PathVariable Long id) {
        PostReport report = postReportRepository.findById(id).orElse(null);
        if (report != null && report.getPost() != null && report.getPost().getUser() != null) {
            User reportedUser = report.getPost().getUser();
            String reason = report.getReason();
            String postContent = report.getPost().getContent();
            
            // Gửi email cảnh báo
            emailService.sendWarningEmail(reportedUser.getEmail(), reportedUser.getFullname(), postContent, reason);
            
            return ResponseEntity.ok(Map.of("message", "Đã gửi email cảnh báo yêu cầu chỉnh sửa/xóa bài viết trong 2 ngày tới người dùng " + reportedUser.getUsername() + " thành công."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Lỗi gửi email cảnh báo."));
    }
}
