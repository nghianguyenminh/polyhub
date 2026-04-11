package com.polyhub.service.client;

import com.polyhub.entity.Category;
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

    /**
     * Upload tài liệu từ người dùng Client lên Cloudinary và lưu thông tin vào DB.
     */
    @Transactional
    public Document shareDocument(String title, String description, Long categoryId, MultipartFile file) throws IOException {
        
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
        document.setDownloadCount(0); // Ban đầu chưa ai tải

        return documentRepository.save(document);
    }

    /**
     * Lấy tất cả tài liệu để render trang chủ (Tạm thời get All, sau này có thể thêm Paging/Sorting)
     */
    public java.util.List<Document> getAllDocuments() {
        return documentRepository.findByStatus(com.polyhub.entity.DocumentStatus.APPROVED);
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
