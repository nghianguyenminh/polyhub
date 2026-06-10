package com.polyhub.dto;

import lombok.Data;

@Data
public class CommentRequestDTO {
    private String content;
    private Long postId;
    private Long parentId; // Nếu là bình luận trả lời, truyền ID của bình luận cha vào đây
}