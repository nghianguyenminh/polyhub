package com.polyhub.controller.api.admin;

import com.polyhub.entity.Post;
import com.polyhub.entity.PostReport;
import com.polyhub.repository.PostReportRepository;
import com.polyhub.repository.PostRepository;
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
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN', 'CONTENT_ADMIN')")
public class AdminReportApiController {

    private final PostReportRepository postReportRepository;
    private final PostRepository postRepository;

    @GetMapping
    public ResponseEntity<?> getReports(@RequestParam(defaultValue = "1") int page) {
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PostReport> reportPage = postReportRepository.findAll(pageable);
        
        long pendingCount = postReportRepository.count();
        long resolvedCount = 0;
        long falseCount = 0;

        // Build response manually to avoid lazy-loading serialization errors
        java.util.List<Map<String, Object>> reportList = new java.util.ArrayList<>();
        for (PostReport r : reportPage.getContent()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("reason", r.getReason());
            item.put("createdAt", r.getCreatedAt());

            // Post info
            if (r.getPost() != null) {
                Map<String, Object> postMap = new HashMap<>();
                postMap.put("id", r.getPost().getId());
                postMap.put("content", r.getPost().getContent());
                if (r.getPost().getUser() != null) {
                    Map<String, Object> postUser = new HashMap<>();
                    postUser.put("username", r.getPost().getUser().getUsername());
                    postUser.put("fullname", r.getPost().getUser().getFullname());
                    postUser.put("avatar", r.getPost().getUser().getAvatar());
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

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')")
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

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectReport(@PathVariable Long id) {
        if (postReportRepository.existsById(id)) {
            postReportRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối báo cáo."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Lỗi từ chối báo cáo."));
    }
}
