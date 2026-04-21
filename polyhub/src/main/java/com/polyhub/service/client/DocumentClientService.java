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

    /**
     * Upload tài liệu từ người dùng Client lên Cloudinary và lưu thông tin vào DB.
     */
    @Transactional
    public Document shareDocument(String title, String description, Long categoryId, MultipartFile file, User uploader) throws IOException {
        
        // 1. Kiểm tra Category có tồn tại
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Chuyên ngành."));

        // 2. Phân loại định dạng file dựa trên phần mở rộng (extension)
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String documentType = determineDocumentType(fileExtension); // Phân loại: PDF, WORD, ZIP, EXCEL...

        // 3. Upload file lên Cloudinary (qua service đã viết trước đó)
        Map<String, Object> uploadResult = fileStorageService.uploadFile(file);
        
        // Lấy các tham số về từ Cloudinary
        String fileUrl = (String) uploadResult.get("url"); // Có thể đổi thành "secure_url" (https) nếu cần
        String publicId = (String) uploadResult.get("public_id");
        Long fileSize = file.getSize(); // Hoặc lấy từ uploadResult.get("bytes")

        // 4. Khởi tạo đối tượng Document và lưu DB
        Document document = new Document();
        document.setTitle(title.trim());
        document.setDescription(description.trim());
        document.setCategory(category);
        document.setDocumentType(documentType);
        document.setFileUrl(fileUrl);
        document.setFilePublicId(publicId);
        document.setFileSize(fileSize);
        document.setUploader(uploader); // Bổ sung: Gán mác Sinh viên / Mentor đăng tài liệu
        document.setDownloadCount(0); // Ban đầu chưa ai tải

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
     * Lấy danh sách ID document mà User đã lưu
     */
    public java.util.Set<Long> getSavedDocumentIds(User user) {
        org.springframework.data.domain.Page<com.polyhub.entity.SavedDocument> filterPage = 
            savedDocumentRepository.findByUserOrderBySavedAtDesc(user, org.springframework.data.domain.PageRequest.of(0, 9999));
        
        java.util.Set<Long> setIds = new java.util.HashSet<>();
        for (com.polyhub.entity.SavedDocument s : filterPage.getContent()) {
            setIds.add(s.getDocument().getId());
        }
        return setIds;
    }

    /**
     * Lấy tất cả tài liệu để render trang chủ (Tạm thời get All, sau này có thể thêm Paging/Sorting)
     */
    public java.util.List<Document> getAllDocuments() {
        return documentRepository.findByStatus(com.polyhub.entity.DocumentStatus.APPROVED);
    }

    /**
     * Lấy số lượng tài liệu đã duyệt theo từng loại tài liệu
     */
    public java.util.Map<String, Long> getApprovedDocumentTypeCounts() {
        java.util.List<Object[]> results = documentRepository.countApprovedByDocumentType();
        java.util.Map<String, Long> counts = new java.util.HashMap<>();
        for (Object[] result : results) {
            String type = (String) result[0];
            Long count = ((Number) result[1]).longValue();
            counts.put(type, count);
        }
        return counts;
    }

    /**
     * Lấy số lượng tài liệu đã duyệt theo từng Category ID
     */
    public java.util.Map<Long, Long> getApprovedCategoryCounts() {
        java.util.List<Object[]> results = documentRepository.countApprovedByCategory();
        java.util.Map<Long, Long> counts = new java.util.HashMap<>();
        for (Object[] result : results) {
            Long categoryId = ((Number) result[0]).longValue();
            Long count = ((Number) result[1]).longValue();
            counts.put(categoryId, count);
        }
        return counts;
    }

    /**
     * Xử lý Nghiệp vụ: Tăng lượt tải và trả về URL file
     */
    @Transactional
    public String getDownloadUrlAndIncrementCount(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài liệu này."));
        
        // Tăng lượt tải
        document.setDownloadCount(document.getDownloadCount() + 1);
        documentRepository.save(document);
        
        return document.getFileUrl();
    }

    // --- CÁC HÀM TIỆN ÍCH DÙNG CHUNG TRONG SERVICE ---

    // Hàm lấy đuôi file (vd: pdf, docx, zip)
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    // Hàm nhận diện loại tài liệu để gán Tag dễ lọc
    private String determineDocumentType(String extension) {
        return switch (extension) {
            case "pdf" -> "PDF";
            case "doc", "docx" -> "WORD";
            case "xls", "xlsx" -> "EXCEL";
            case "ppt", "pptx" -> "PPT";
            case "zip", "rar", "7z" -> "ZIP";
            default -> "OTHER"; // File khác (txt, img, v.v...)
        };
    }
}
