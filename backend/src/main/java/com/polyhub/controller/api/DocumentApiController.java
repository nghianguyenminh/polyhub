package com.polyhub.controller.api;

import com.polyhub.entity.Category;
import com.polyhub.entity.Document;
import com.polyhub.entity.ReportReason;
import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.CategoryService;
import com.polyhub.service.client.DocumentClientService;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
public class DocumentApiController {

    @Autowired
    private DocumentClientService documentClientService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getDocuments(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category_id", required = false) Long categoryId,
            @RequestParam(value = "document_type", required = false) String documentType,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "8") int size,
            Principal principal) {

        List<Category> categories = categoryService.getActiveCategoriesForDropdown();
        Page<Document> documentPage = documentClientService.getDocumentsForClient(keyword, categoryId, documentType,
                page, size);

        final Set<Long> savedDocIds;
        if (principal != null) {
            User currentUser = userRepository.findById(principal.getName()).orElse(null);
            if (currentUser != null) {
                savedDocIds = documentClientService.getSavedDocumentIds(currentUser);
            } else {
                savedDocIds = new HashSet<>();
            }
        } else {
            savedDocIds = new HashSet<>();
        }

        Map<Long, Long> categoryCounts = documentClientService.getApprovedCategoryCounts();
        Map<String, Long> docTypeCounts = documentClientService.getApprovedDocumentTypeCounts();

        List<Map<String, Object>> docsList = documentPage.getContent().stream()
                .map(doc -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", doc.getId());
                    map.put("title", doc.getTitle());
                    map.put("description", doc.getDescription());
                    map.put("documentType", doc.getDocumentType());
                    map.put("fileUrl", doc.getFileUrl());
                    map.put("fileSize", doc.getFileSize());
                    map.put("downloadCount", doc.getDownloadCount());
                    map.put("createdAt", doc.getCreatedAt());
                    map.put("isSaved", savedDocIds.contains(doc.getId()));
                    map.put("aiSummary", doc.getAiSummary());
                    map.put("aiKeywords", doc.getAiKeywords());
                    map.put("summaryStatus", doc.getSummaryStatus() != null ? doc.getSummaryStatus().name() : null);
                    if (doc.getCategory() != null) {
                        map.put("category", Map.of(
                                "id", doc.getCategory().getId(),
                                "name", doc.getCategory().getName()));
                    }
                    if (doc.getUploader() != null) {
                        map.put("uploader", Map.of(
                                "username", doc.getUploader().getUsername(),
                                "fullname", doc.getUploader().getFullname(),
                                "avatar", doc.getUploader().getAvatar()));
                    }
                    return map;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> categoriesList = categories.stream()
                .map(cat -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", cat.getId());
                    m.put("name", cat.getName());
                    m.put("code", cat.getCode());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("documents", docsList);
        response.put("categories", categoriesList);
        response.put("categoryCounts", categoryCounts);
        response.put("docTypeCounts", docTypeCounts);
        response.put("currentPage", documentPage.getNumber() + 1);
        response.put("totalPages", documentPage.getTotalPages());
        response.put("totalElements", documentPage.getTotalElements());
        response.put("hasNext", documentPage.hasNext());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("file") MultipartFile file,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Vui lòng đăng nhập để tải lên tài liệu!"));
        }

        User currentUser = userRepository.findById(principal.getName()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Người dùng không tồn tại"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn 1 file để tải lên!"));
        }

        try {
            Document doc = documentClientService.shareDocument(title, description, categoryId, file, currentUser);
            return ResponseEntity.ok(Map.of(
                    "message", "Tải tài liệu thành công! Tài liệu của bạn đã được đưa lên hệ thống chờ duyệt.",
                    "documentId", doc.getId()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Đã xảy ra lỗi mạng khi tải file. Thử lại sau nhé!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/download/{id}")
    public void downloadDocument(@PathVariable("id") Long id, HttpServletResponse response) throws IOException {
        try {
            documentClientService.getDownloadUrlAndIncrementCount(id, response);
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Không thể tải tài liệu: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<?> reportDocument(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Vui lòng đăng nhập để báo cáo tài liệu!"));
        }
        User currentUser = userRepository.findById(principal.getName()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Người dùng không tồn tại"));
        }

        String reasonStr = body.get("reason");
        String detail = body.get("detail");

        if (reasonStr == null || reasonStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn lý do báo cáo!"));
        }

        try {
            ReportReason reason = ReportReason.valueOf(reasonStr);
            // ...
            documentClientService.reportDocument(id, currentUser, reason, detail);
            return ResponseEntity.ok(Map.of("message", "Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét sớm nhất!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lý do báo cáo không hợp lệ"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            // Thêm dòng này để in lỗi thật ra console của Spring Boot
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi Server thực sự là: " + e.getMessage()));
        }
    }
}
