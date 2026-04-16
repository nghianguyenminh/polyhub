package com.polyhub.service.admin;

import com.polyhub.entity.Document;
import com.polyhub.repository.DocumentRepository;
import com.polyhub.service.EmailService;
import com.polyhub.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentAdminService {

    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService; // Thêm EmailService


    // Filter, Sort and Pagination
    public Page<Document> getDocuments(String keyword, Long categoryId, int page, int size) {
        // Mặc định sắp xếp mới nhất lên đầu
        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "uploadedAt"));
        
        Specification<Document> spec = Specification.where(null);

        if (keyword != null && !keyword.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%"));
        }

        if (categoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId));
        }

        return documentRepository.findAll(spec, pageRequest);
    }

    public Document getDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu ID: " + id));
    }

    // Duyệt tài liệu
    public void approveDocument(Long id) {
        Document doc = getDocumentById(id);
        doc.setApproved(true);
        documentRepository.save(doc);
    }

    // Từ chối / Gỡ tài liệu
    public void rejectOrTakedownDocument(Long id, String reason) {
        Document doc = getDocumentById(id);
        doc.setApproved(false);
        documentRepository.save(doc);

        // Bổ sung: Gửi Email cho Uploader (Nếu có người tải lên)
        if (doc.getUser() != null && doc.getUser().getEmail() != null) {
            emailService.sendRejectionEmail(doc.getUser().getEmail(), doc.getUser().getFullname(), doc.getTitle(), reason);
        }
    }

    // Phục hồi / Mở khóa tài liệu
    public void restoreDocument(Long id) {
        Document doc = getDocumentById(id);
        doc.setApproved(true);
        documentRepository.save(doc);
    }

    // Xóa vật lý (Hard delete: Xóa Cloudinary & DB)
    public void hardDeleteDocument(Long id) {
        Document doc = getDocumentById(id);

        try {
            // 1. Xóa file trên Cloudinary
            if (doc.getFileUrl() != null && !doc.getFileUrl().isEmpty()) {
                fileStorageService.deleteFile(doc.getFileUrl());
            }
        } catch (Exception e) {
            // In log nhưng vẫn tiếp tục xóa trong DB để tránh dữ liệu rác
            e.printStackTrace();
        }

        // 2. Xóa khỏi database
        documentRepository.delete(doc);
    }

    // API thống kê nhanh
    public Map<String, Object> getDocumentStats() {
        Map<String, Object> stats = new HashMap<>();
        long total = documentRepository.count();
        long approved = documentRepository.countByApproved(true);
        long pending = total - approved;

        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("approved", approved);

        return stats;
    }


    public List<Object[]> getCategoryStats() {
        return documentRepository.findAll().stream()
                .collect(Collectors.groupingBy(d -> d.getCategory().getId(), Collectors.counting()))
                .entrySet().stream()
                .map(entry -> new Object[]{entry.getKey(), entry.getValue()})
                .collect(Collectors.toList());
    }

}
