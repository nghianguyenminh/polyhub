package com.polyhub.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "saved_documents")
public class SavedDocument implements Serializable {

    @Id
    private String id;

    // Mapping tới User (Ai đã lưu)
    private String userId;

    // Mapping tới Document (Tài liệu nào được lưu)
    private String documentId;

    // Thời gian lưu
    private LocalDateTime savedAt;
}
