package com.polyhub.service.client;

import com.polyhub.entity.Document;
import com.polyhub.entity.SavedDocument;
import com.polyhub.entity.User;
import com.polyhub.repository.DocumentRepository;
import com.polyhub.repository.SavedDocumentRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SavedDocumentService {

    private final SavedDocumentRepository savedDocumentRepository;
    private final DocumentRepository documentRepository;

    /**
     * Lấy danh sách các tài liệu đã lưu của người dùng có tuỳ chỉnh phân trang.
     */
    public Page<SavedDocument> getSavedDocumentsByUser(User user, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size);
        return savedDocumentRepository.findByUserOrderBySavedAtDesc(user, pageable);
    }

    /**
     * Bật/Tắt chức năng lưu tài liệu.
     * Trả về TRUE nếu thực hiện thao tác LƯU, FALSE nếu thực hiện BỎ LƯU.
     */
    @Transactional
    public boolean toggleSaveDocument(User user, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài liệu với ID: " + documentId));

        Optional<SavedDocument> existingRecord = savedDocumentRepository.findByUserAndDocument(user, document);
        
        if (existingRecord.isPresent()) {
            // Đã lưu -> Tiến hành xoá/bỏ lưu
            savedDocumentRepository.delete(existingRecord.get());
            return false; // Returns status "unsaved"
        } else {
            // Chưa lưu -> Tiến hành thêm record
            SavedDocument savedDocument = new SavedDocument();
            savedDocument.setUser(user);
            savedDocument.setDocument(document);
            savedDocument.setSavedAt(LocalDateTime.now());
            savedDocumentRepository.save(savedDocument);
            return true; // Returns status "saved"
        }
    }

    /**
     * Hàm lấy tổng số lượng tài liệu 1 User đã lưu.
     */
    public long countSavedDocumentsByUser(User user) {
        return savedDocumentRepository.countByUser(user);
    }
}
