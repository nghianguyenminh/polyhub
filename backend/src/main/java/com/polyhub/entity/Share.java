package com.polyhub.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Document(collection = "shares")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Share {
    @Id
    private String id;
    
    private Long postId;
    private String username;
    private String destination; // Ví dụ: "Facebook", "Twitter", "Message"
    private LocalDateTime createdAt;
}