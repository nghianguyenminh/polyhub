package com.polyhub.service.client;

import com.polyhub.entity.Category;
import com.polyhub.entity.User;
import com.polyhub.entity.Document;
import com.polyhub.entity.DocumentStatus;
import com.polyhub.entity.SavedDocument;
import com.polyhub.entity.User;
import com.polyhub.repository.CategoryRepository;
import com.polyhub.repository.DocumentRepository;
import com.polyhub.repository.SavedDocumentRepository;
import com.polyhub.service.FileStorageService;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class DocumentClientService {

<<<<<<< HEAD
  private final DocumentRepository documentRepository;
  private final CategoryRepository categoryRepository;
  private final FileStorageService fileStorageService;
  private final SavedDocumentRepository savedDocumentRepository;

  @Transactional
  public Document shareDocument(
    String title,
    String description,
    Long categoryId,
    MultipartFile file,
    User uploader
  ) throws IOException {
    Category category = categoryRepository
      .findById(categoryId)
      .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Chuyên ngành."));
=======
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
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

    Map<String, Object> uploadResult = fileStorageService.uploadFile(file);
    String fileUrl = (String) uploadResult.get("url");

    Document document = new Document();
    document.setTitle(title.trim());
    document.setDescription(description.trim());
    document.setCategory(category);
    document.setFileUrl(fileUrl);
    document.setFileName(file.getOriginalFilename());
    document.setFileType(extractFileType(file.getOriginalFilename()));
    document.setThumbnailUrl("");
    document.setUser(uploader);
    document.setStatus(DocumentStatus.PENDING); // Chờ admin duyệt

<<<<<<< HEAD
    return documentRepository.save(document);
  }
=======
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
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

  public Page<Document> getDocumentsForClient(
    String keyword,
    Long categoryId,
    int page,
    int size
  ) {
    PageRequest pageRequest = PageRequest.of(
      page - 1,
      size,
      Sort.by(Sort.Direction.DESC, "uploadedAt")
    );

    Specification<Document> spec = Specification.where(
      (root, query, cb) -> cb.equal(root.get("status"), DocumentStatus.APPROVED)
    );

    if (StringUtils.hasText(keyword)) {
      spec = spec.and(
        (root, query, cb) ->
          cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%")
      );
    }

<<<<<<< HEAD
    if (categoryId != null) {
      spec = spec.and(
        (root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId)
      );
    }

    return documentRepository.findAll(spec, pageRequest);
  }
=======
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

    // --- CÁC HÀM TIỆN ÍCH DÙNG CHUNG TRONG SERVICE ---
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

  public Set<Long> getSavedDocumentIds(User user) {
    Page<SavedDocument> filterPage = savedDocumentRepository.findByUserOrderBySavedAtDesc(
      user,
      PageRequest.of(0, 9999)
    );
    Set<Long> setIds = new HashSet<>();
    for (SavedDocument s : filterPage.getContent()) {
      setIds.add(s.getDocument().getId());
    }
    return setIds;
  }

  private String extractFileType(String fileName) {
    if (fileName == null || fileName.lastIndexOf(".") == -1) {
      return "khac";
    }
    return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
  }
}
