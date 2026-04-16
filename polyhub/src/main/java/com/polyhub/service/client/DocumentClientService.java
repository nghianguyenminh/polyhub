package com.polyhub.service.client;

import com.polyhub.entity.Category;
import com.polyhub.entity.Document;
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
    document.setApproved(false); // Chờ admin duyệt

    return documentRepository.save(document);
  }

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
      (root, query, cb) -> cb.isTrue(root.get("approved"))
    );

    if (StringUtils.hasText(keyword)) {
      spec = spec.and(
        (root, query, cb) ->
          cb.like(cb.lower(root.get("title")), "%" + keyword.toLowerCase() + "%")
      );
    }

    if (categoryId != null) {
      spec = spec.and(
        (root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId)
      );
    }

    return documentRepository.findAll(spec, pageRequest);
  }

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

  public List<Document> getAllDocuments() {
    return documentRepository.findByApproved(true);
  }

  private String extractFileType(String fileName) {
    if (fileName == null || fileName.lastIndexOf(".") == -1) {
      return "khac";
    }
    return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
  }
}
