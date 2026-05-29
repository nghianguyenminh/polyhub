package com.polyhub.service.impl;

import com.polyhub.entity.Document;
import com.polyhub.repository.DocumentRepository;
import com.polyhub.service.DocumentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;

    @Override
    public List<Document> getAllDocumentsByCategory(Long categoryId) {
        return documentRepository.findAll(); // This is a placeholder, will need to be updated
    }
}
