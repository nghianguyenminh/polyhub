package com.polyhub.controller.api.admin;

import com.polyhub.entity.Category;
import com.polyhub.entity.Document;
import com.polyhub.entity.DocumentStatus;
import com.polyhub.service.CategoryService;
import com.polyhub.service.admin.DocumentAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/documents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'CONTENT_ADMIN')")
public class AdminDocumentApiController {

    private final DocumentAdminService documentAdminService;
    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<?> getDocuments(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category_id", required = false) Long categoryId,
            @RequestParam(value = "status", required = false) DocumentStatus status,
            @RequestParam(value = "document_type", required = false) String documentType,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "include_stats", defaultValue = "false") boolean includeStats,
            @RequestParam(value = "include_categories", defaultValue = "false") boolean includeCategories) {

        int size = 10; 
        Page<Document> documentPage = documentAdminService.getDocuments(keyword, categoryId, status, documentType, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("documents", documentPage.getContent());
        response.put("currentPage", page);
        response.put("totalPages", documentPage.getTotalPages());

        if (includeCategories) {
            List<Category> categories = categoryService.getAllCategoriesForAdmin();
            response.put("categories", categories);
        }

        if (includeStats) {
            Map<String, Object> stats = documentAdminService.getDocumentStats();
            List<Object[]> typeStats = documentAdminService.getDocumentTypeStats();
            List<Object[]> categoryStats = documentAdminService.getCategoryStats();
            List<Object[]> statusStats = documentAdminService.getStatusStats();
            response.put("stats", stats);
            response.put("typeStats", typeStats);
            response.put("categoryStats", categoryStats);
            response.put("statusStats", statusStats);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveDocument(@PathVariable Long id) {
        try {
            documentAdminService.approveDocument(id);
            return ResponseEntity.ok(Map.of("message", "Đã duyệt tài liệu thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/hidden")
    public ResponseEntity<?> hideDocument(@PathVariable Long id, 
                                              @RequestBody Map<String, String> body) {
        try {
            String reason = body.get("reason");
            documentAdminService.rejectOrTakedownDocument(id, reason);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối/gỡ tài liệu thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/delete")
    public ResponseEntity<?> hardDeleteDocument(@PathVariable Long id) {
        try {
            documentAdminService.hardDeleteDocument(id);
            return ResponseEntity.ok(Map.of("message", "Xóa vĩnh viễn thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restoreDocument(@PathVariable Long id) {
        try {
            documentAdminService.restoreDocument(id);
            return ResponseEntity.ok(Map.of("message", "Phục hồi thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }
}
