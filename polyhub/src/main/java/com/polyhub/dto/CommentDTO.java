package com.polyhub.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDTO {
    private Long id;
    private String content;
    private Long postId;
    private String username;
    private String fullname;
    private String avatar;
    private Long parentId;
    private LocalDateTime createdAt;
    private List<CommentDTO> replies; // Dành cho danh sách các lượt trả lời
}