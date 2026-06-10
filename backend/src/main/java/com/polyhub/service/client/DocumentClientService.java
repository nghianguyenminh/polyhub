package com.polyhub.service.client;

import com.polyhub.entity.Category;
import com.polyhub.entity.User;
import com.polyhub.entity.Document;
import com.polyhub.repository.CategoryRepository;
import com.polyhub.repository.DocumentRepository;
import com.polyhub.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentClientService {

    private final DocumentRepository documentRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;
    private final com.polyhub.repository.SavedDocumentRepository savedDocumentRepository;

    private java.util.Map<String, Long> cachedTypeCounts = null;
    private long lastTypeCountsTime = 0;
    private java.util.Map<Long, Long> cachedCategoryCounts = null;
    private long lastCategoryCountsTime = 0;
    private static final long COUNTS_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

    @Transactional
    public Document shareDocument(String title, String description, Long categoryId, MultipartFile file, User uploader) throws IOException {
        
       
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Chuyên ngành."));

       
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String documentType = determineDocumentType(fileExtension); 

      
        Map<String, Object> uploadResult = fileStorageService.uploadFile(file);
        
       
        String fileUrl = (String) uploadResult.get("url"); 
        String publicId = (String) uploadResult.get("public_id");
        Long fileSize = file.getSize(); 

       
        Document document = new Document();
        document.setTitle(title.trim());
        document.setDescription(description.trim());
        document.setCategory(category);
        document.setDocumentType(documentType);
        document.setFileUrl(fileUrl);
        document.setFilePublicId(publicId);
        document.setFileSize(fileSize);
        document.setUploader(uploader); 
        document.setDownloadCount(0); 

        return documentRepository.save(document);
    }

    /**
     * Lấy danh sách tài liệu hiển thị bên Client (Hỗ trợ phân trang và lọc)
     * Trạng thái mặc định là APPROVED
     */
    public org.springframework.data.domain.Page<Document> getDocumentsForClient(String keyword, Long categoryId, String documentType, int page, int size) {
        org.springframework.data.domain.PageRequest pageRequest = org.springframework.data.domain.PageRequest.of(page - 1, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return documentRepository.searchAndFilterDocuments(com.polyhub.entity.DocumentStatus.APPROVED, documentType, keyword, categoryId, pageRequest);
    }

    /**
     * Lấy danh sách ID document mà User đã lưu (Tối ưu hóa chỉ lấy ID từ DB)
     */
    public java.util.Set<Long> getSavedDocumentIds(User user) {
        return new java.util.HashSet<>(savedDocumentRepository.findDocumentIdsByUser(user));
    }

   
    public java.util.List<Document> getAllDocuments() {
        return documentRepository.findByStatus(com.polyhub.entity.DocumentStatus.APPROVED);
    }

    
    public synchronized java.util.Map<String, Long> getApprovedDocumentTypeCounts() {
        long now = System.currentTimeMillis();
        if (cachedTypeCounts != null && (now - lastTypeCountsTime) < COUNTS_CACHE_DURATION_MS) {
            return cachedTypeCounts;
        }
        java.util.List<Object[]> results = documentRepository.countApprovedByDocumentType();
        java.util.Map<String, Long> counts = new java.util.HashMap<>();
        for (Object[] result : results) {
            String type = (String) result[0];
            Long count = ((Number) result[1]).longValue();
            counts.put(type, count);
        }
        cachedTypeCounts = counts;
        lastTypeCountsTime = now;
        return counts;
    }

    
    public synchronized java.util.Map<Long, Long> getApprovedCategoryCounts() {
        long now = System.currentTimeMillis();
        if (cachedCategoryCounts != null && (now - lastCategoryCountsTime) < COUNTS_CACHE_DURATION_MS) {
            return cachedCategoryCounts;
        }
        java.util.List<Object[]> results = documentRepository.countApprovedByCategory();
        java.util.Map<Long, Long> counts = new java.util.HashMap<>();
        for (Object[] result : results) {
            Long categoryId = ((Number) result[0]).longValue();
            Long count = ((Number) result[1]).longValue();
            counts.put(categoryId, count);
        }
        cachedCategoryCounts = counts;
        lastCategoryCountsTime = now;
        return counts;
    }

    
    @Transactional
    public String getDownloadUrlAndIncrementCount(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài liệu này."));
        
        // Tăng lượt tải
        document.setDownloadCount(document.getDownloadCount() + 1);
        documentRepository.save(document);
        
        return document.getFileUrl();
    }

    
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    
    private String determineDocumentType(String extension) {
        return switch (extension) {
            case "pdf" -> "PDF";
            case "doc", "docx" -> "WORD";
            case "xls", "xlsx" -> "EXCEL";
            case "ppt", "pptx" -> "PPT";
            case "zip", "rar", "7z" -> "ZIP";
            default -> "OTHER"; 
        };
    }
}
