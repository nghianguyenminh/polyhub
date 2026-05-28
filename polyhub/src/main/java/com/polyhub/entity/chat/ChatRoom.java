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
@Document(collection = "chat_rooms")
public class ChatRoom {
    @Id
    private String id;

    // Lưu ID của 2 người trong cuộc trò chuyện (ví dụ: Mentee và Mentor)
    private String user1Id;
    private String user2Id;

    // Lưu lại tin nhắn cuối cùng để hiển thị ở danh sách (Sidebar)
    private String lastMessage;

    // Thời gian cập nhật tin nhắn cuối cùng để sort phòng chat nào mới nhất lên đầu
    private Date lastUpdated;
    private String lastSenderId; // Lưu ID người gửi tin nhắn cuối
    private boolean isLastMessageRead;
}
