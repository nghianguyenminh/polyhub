package com.polyhub.entity.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

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

    // Thời gian gửi
    private Date timestamp;
}
