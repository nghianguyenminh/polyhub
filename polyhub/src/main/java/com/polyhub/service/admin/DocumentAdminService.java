package com.polyhub.service.admin;

import com.polyhub.entity.Document;
import com.polyhub.entity.DocumentStatus;
import com.polyhub.repository.DocumentRepository;
import com.polyhub.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class DocumentAdminService {

    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;

    // Filter, Sort and Pagination
    public Page<Document> getDocuments(String keyword, Long categoryId, DocumentStatus status, int page, int size) {
        // Mặc định sắp xếp mới nhất lên đầu
        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return documentRepository.searchAndFilterDocuments(status, keyword, categoryId, pageRequest);
    }

    public Document getDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu ID: " + id));
    }

    // Duyệt tài liệu
    public void approveDocument(Long id) {
        Document doc = getDocumentById(id);
        doc.setStatus(DocumentStatus.APPROVED);
        doc.setRejectionReason(null);
        documentRepository.save(doc);
    }

    // Từ chối / Gỡ tài liệu (Soft delete)
    public void rejectOrTakedownDocument(Long id, String reason) {
        Document doc = getDocumentById(id);
        doc.setStatus(DocumentStatus.HIDDEN);
        doc.setRejectionReason(reason);
        documentRepository.save(doc);
    }

    // Xóa vật lý (Hard delete: Xóa Cloudinary & DB)
    public void hardDeleteDocument(Long id) {
        Document doc = getDocumentById(id);
        
        try {
            // 1. Xóa file trên Cloudinary
            if (doc.getFilePublicId() != null && !doc.getFilePublicId().isEmpty()) {
                fileStorageService.deleteFile(doc.getFilePublicId());
            }
        } catch (Exception e) {
            // In log nhưng vẫn tiếp tục xóa trong DB để tránh dữ liệu rác
            e.printStackTrace();
        }
        
        // 2. Xóa khỏi database
        documentRepository.delete(doc);
    }

    // API thống kê nhanh
    public Map<String, Long> getDocumentStats() {
        Map<String, Long> stats = new HashMap<>();
        long total = documentRepository.count();
        long pending = documentRepository.findByStatus(DocumentStatus.PENDING).size();
        long approved = documentRepository.findByStatus(DocumentStatus.APPROVED).size();
        long hidden = documentRepository.findByStatus(DocumentStatus.HIDDEN).size();
        
        // Tính tổng dung lượng Storage (Chỉ tính những tài liệu chưa bị xóa cứng)
        long totalStorageBytes = documentRepository.findAll().stream()
                .filter(d -> d.getFileSize() != null)
                .mapToLong(Document::getFileSize)
                .sum();
        
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("approved", approved);
        stats.put("hidden", hidden);
        stats.put("storageBytes", totalStorageBytes);

        return stats;
    }
}
