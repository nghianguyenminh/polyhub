package com.polyhub.entity.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import org.springframework.data.annotation.Transient;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_messages")
public class ChatMessage {
    @Id
    private String id;

    // ID của phòng chat chứa tin nhắn này
    private String roomId;

    // ID của người gửi tin nhắn
    private String senderId;

    // Nội dung tin nhắn
    private String content;

    // Đánh dấu người nhận đã đọc hay chưa (hỗ trợ đếm Unread Badge)
    @Builder.Default
    private Boolean isRead = false;

    @Builder.Default
    private String type = "TEXT";

    // Thời gian gửi
    private Date timestamp;

    // Phản hồi cảm xúc (userId -> emoji)
    @Builder.Default
    private Map<String, String> reactions = new HashMap<>();

    // ID của tin nhắn đích (dành riêng cho type = "REACTION", không lưu vào DB)
    @Transient
    private String targetMessageId;
}
