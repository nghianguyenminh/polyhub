package com.polyhub.service;

import com.polyhub.entity.Document;
import java.util.List;

public interface DocumentService {
    List<Document> getAllDocumentsByCategory(Long categoryId);
}
