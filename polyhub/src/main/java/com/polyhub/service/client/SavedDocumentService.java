package com.polyhub.service.client;

import com.polyhub.entity.Document;
import com.polyhub.entity.SavedDocument;
import com.polyhub.entity.User;
import com.polyhub.repository.DocumentRepository;
import com.polyhub.repository.SavedDocumentRepository;
<<<<<<< HEAD
import java.time.LocalDateTime;
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

<<<<<<< HEAD
=======
import java.util.Date;
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
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
<<<<<<< HEAD
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size);
=======
        Pageable pageable = PageRequest.of(page - 1, size);
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
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
<<<<<<< HEAD
            savedDocument.setSavedAt(LocalDateTime.now());
=======
            savedDocument.setSavedAt(new Date());
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
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
