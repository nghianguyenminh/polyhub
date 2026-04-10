package com.polyhub.service.admin;

import com.polyhub.entity.User;
import com.polyhub.service.EmailService;
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
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DocumentAdminService {

    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService; // Thêm EmailService


    // Filter, Sort and Pagination
    public Page<Document> getDocuments(String keyword, Long categoryId, DocumentStatus status, String documentType, int page, int size) {
        // Mặc định sắp xếp mới nhất lên đầu
        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return documentRepository.searchAndFilterDocuments(status, documentType, keyword, categoryId, pageRequest);
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

    // Từ chối / Gỡ tài liệu
    public void rejectOrTakedownDocument(Long id, String reason) {
        Document doc = getDocumentById(id);
        doc.setStatus(DocumentStatus.REJECTED); // Đổi thành REJECTED (hoặc HIDDEN tùy ý định ban đầu, nhưng REJECT chuẩn hơn)
        doc.setRejectionReason(reason);
        documentRepository.save(doc);

        // Bổ sung: Gửi Email cho Uploader (Nếu có người tải lên)
        User uploader = doc.getUploader();
        if (uploader != null && uploader.getEmail() != null) {
            emailService.sendRejectionEmail(uploader.getEmail(), uploader.getFullname(), doc.getTitle(), reason);
        }
    }

    // Phục hồi / Mở khóa tài liệu
    public void restoreDocument(Long id) {
        Document doc = getDocumentById(id);
        doc.setStatus(DocumentStatus.APPROVED);
        doc.setRejectionReason(null);
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
    public Map<String, Object> getDocumentStats() {
        Map<String, Object> stats = new HashMap<>();
        long total = documentRepository.count();
        long pending = documentRepository.findByStatus(DocumentStatus.PENDING).size();
        long approved = documentRepository.findByStatus(DocumentStatus.APPROVED).size();
        long hidden = documentRepository.findByStatus(DocumentStatus.HIDDEN).size();
        
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("approved", approved);
        stats.put("hidden", hidden);

        // Lấy dung lượng storage thực tế từ Cloudinary
        try {
            Map<String, Object> usage = fileStorageService.getStorageUsage();
            if (usage != null && usage.containsKey("storage")) {
                Map<String, Object> storageData = (Map<String, Object>) usage.get("storage");
                
                // Tránh NullPointerException do một số tài khoản Cloudinary không trả về 'usage'/'limit' 
                Object usageObj = storageData.get("usage");
                Object limitObj = storageData.get("limit");
                
                long usageBytes = usageObj != null ? Long.parseLong(usageObj.toString()) : 0L;
                long limitBytes = limitObj != null ? Long.parseLong(limitObj.toString()) : 0L;

                // Nếu không có usage, fallback tính từ DB
                if (usageBytes == 0L) {
                    usageBytes = getStorageFromDB();
                }
                // Nếu Cloudinary không cho biết giới hạn (VD Free plan có lúc không trả), gán tạm 10GB làm mốc
                if (limitBytes == 0L) {
                    limitBytes = 10L * 1024 * 1024 * 1024;
                }
                
                // Quy đổi sang GB / MB
                double usageGb = usageBytes / 1024.0 / 1024.0 / 1024.0;
                double limitGb = limitBytes / 1024.0 / 1024.0 / 1024.0;
                
                // Calculate percentage
                double percent = limitBytes > 0 ? (double) usageBytes / limitBytes * 100 : 0;
                
                stats.put("cloudinaryUsage", usageBytes);
                stats.put("cloudinaryLimit", limitBytes);
                stats.put("cloudinaryUsageGb", String.format(Locale.US, "%.2f", usageGb));
                stats.put("cloudinaryLimitGb", String.format(Locale.US, "%.2f", limitGb));
                stats.put("cloudinaryPercent", String.format(Locale.US, "%.1f", percent));
                // Xóa flag lỗi để hiển thị UI
                stats.remove("cloudinaryError");
            } else {
                handleStorageFallback(stats);
            }
        } catch (Exception e) {
            System.err.println("Lấy dung lượng Storage Cloudinary thất bại: " + e.getMessage());
            handleStorageFallback(stats);
        }

        return stats;
    }

    private long getStorageFromDB() {
        return documentRepository.findAll().stream()
                .filter(d -> d.getFileSize() != null)
                .mapToLong(Document::getFileSize)
                .sum();
    }

    private void handleStorageFallback(Map<String, Object> stats) {
        long usageBytes = getStorageFromDB();
        long limitBytes = 10L * 1024 * 1024 * 1024; // Mặc định 10GB 

        double usageGb = usageBytes / 1024.0 / 1024.0 / 1024.0;
        double limitGb = limitBytes / 1024.0 / 1024.0 / 1024.0;
        double percent = limitBytes > 0 ? (double) usageBytes / limitBytes * 100 : 0;

        stats.put("cloudinaryUsage", usageBytes);
        stats.put("cloudinaryLimit", limitBytes);
        stats.put("cloudinaryUsageGb", String.format(Locale.US, "%.2f", usageGb));
        stats.put("cloudinaryLimitGb", String.format(Locale.US, "%.2f", limitGb));
        stats.put("cloudinaryPercent", String.format(Locale.US, "%.1f", percent));
        // Xóa lỗi để giao diện hiển thị dữ liệu tạm (Không làm vỡ layout)
        stats.remove("cloudinaryError");
    }

    public List<Object[]> getDocumentTypeStats() {
        return documentRepository.countByDocumentType();
    }

    public List<Object[]> getCategoryStats() {
        return documentRepository.countByCategory();
    }

    public List<Object[]> getStatusStats() {
        return documentRepository.countByStatus();
    }
}
