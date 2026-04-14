package com.polyhub.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {
    @Id
    private String id;
    
    private Long postId;
    private String username;
    private String userFullname;
    private String userAvatar;
    private String content;
    private LocalDateTime createdAt;
    
    // Lưu các câu trả lời cho bình luận này
    @Builder.Default
    private List<Comment> replies = new ArrayList<>();
}