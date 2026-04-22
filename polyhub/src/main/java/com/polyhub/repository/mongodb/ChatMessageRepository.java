package com.polyhub.repository.mongodb;

import com.polyhub.entity.chat.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    
    // Load lịch sử chat: Lấy TẤT CẢ tin nhắn của 1 phòng (roomId), 
    // Sắp xếp theo thứ tự Timestamp Tăng dần (Từ cũ tới mới)
    List<ChatMessage> findByRoomIdOrderByTimestampAsc(String roomId);
}