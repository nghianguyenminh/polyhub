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

        // 2. Upload file lên Cloudinary (qua service đã viết trước đó)
        Map<String, Object> uploadResult = fileStorageService.uploadFile(file);
        
        // Lấy các tham số về từ Cloudinary
        String fileUrl = (String) uploadResult.get("url"); // Có thể đổi thành "secure_url" (https) nếu cần

        // 3. Khởi tạo đối tượng Document và lưu DB
        Document document = new Document();
        document.setTitle(title.trim());
        document.setDescription(description.trim());
        document.setCategory(category);
        document.setFileUrl(fileUrl);
        document.setFileName(file.getOriginalFilename());
        document.setThumbnailUrl(""); // Tạm thời để trống
        document.setUser(uploader); // Bổ sung: Gán mác Sinh viên / Mentor đăng tài liệu

        return documentRepository.save(document);
    }

    /**
     * Lấy danh sách tài liệu hiển thị bên Client (Hỗ trợ phân trang và lọc)
     * Trạng thái mặc định là APPROVED
     */
    public org.springframework.data.domain.Page<Document> getDocumentsForClient(String keyword, Long categoryId, int page, int size) {
        org.springframework.data.domain.PageRequest pageRequest = org.springframework.data.domain.PageRequest.of(page - 1, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "uploadedAt"));
        return documentRepository.findByApprovedAndTitleContainingIgnoreCaseAndCategoryId(true, keyword, categoryId, pageRequest);
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
        return documentRepository.findByApproved(true);
    }

}
