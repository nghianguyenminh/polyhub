package com.polyhub.repository;

import com.polyhub.entity.chat.ChatRoom;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatRoomRepository extends MongoRepository<ChatRoom, String> {
    
    // Tìm phòng chat bằng Query NoSQL: 
    // Trả về phòng nơi (user1Id = A VÀ user2Id = B) HOẶC (user1Id = B VÀ user2Id = A)
    // Đảm bảo giữa 2 người chỉ có duy nhất 1 phòng chat chung
    @Query("{ $or: [ { 'user1Id': ?0, 'user2Id': ?1 }, { 'user1Id': ?1, 'user2Id': ?0 } ] }")
    Optional<ChatRoom> findByUsers(String user1Id, String user2Id);
}