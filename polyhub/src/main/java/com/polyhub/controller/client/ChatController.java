package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.entity.chat.ChatMessage;
import com.polyhub.entity.chat.ChatRoom;
import com.polyhub.repository.ChatMessageRepository;
import com.polyhub.repository.ChatRoomRepository;
import com.polyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Date;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatController {

    // Công cụ được Spring Boot cung cấp để Server bắn tin nhắn xuống trình duyệt
    private final SimpMessagingTemplate messagingTemplate;
    
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    /**
     * Dựng trang giao diện Chat
     * Truy cập: /chat?userId=ID_CUA_MENTOR
     */
    @GetMapping("/chat")
    public String chatPage(@ModelAttribute("currentUser") User currentUser,
                           @RequestParam(value = "userId", required = false) String targetUserId, 
                           Model model) {
        // 1. Kiểm tra đăng nhập
        if (currentUser == null) {
            return "redirect:/login";
        }

        // Truyền thêm danh sách các User để hiển thị Sidebar
        List<User> allUsers = userRepository.findAll();
        model.addAttribute("allUsers", allUsers);

        // Nếu chưa chọn ai để chat, cứ load giao diện tĩnh
        if (targetUserId == null) {
            return "client/chat";
        }

        // 2. Tìm người nhận tin nhắn
        User targetUser = userRepository.findById(targetUserId).orElse(null);
        if (targetUser == null) return "client/chat";

        // 3. Khởi tạo hoặc lấy Phòng Chat (NoSQL)
        ChatRoom room = chatRoomRepository.findByUsers(currentUser.getUsername(), targetUserId)
                .orElseGet(() -> {
                    ChatRoom newRoom = ChatRoom.builder()
                            .user1Id(currentUser.getUsername())
                            .user2Id(targetUserId)
                            .lastUpdated(new Date())
                            .build();
                    return chatRoomRepository.save(newRoom);
                });

        // 4. Truyền dữ liệu lên HTML
        model.addAttribute("roomId", room.getId());
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("targetUser", targetUser);
        
        return "client/chat"; 
    }

    /**
     * REST API trả về tin nhắn cũ
     */
    @GetMapping("/api/chat/history")
    @ResponseBody 
    public List<ChatMessage> getChatHistory(@RequestParam String roomId) {
        return chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId);
    }

    /**
     * Cổng Websocket nhận tin từ Client rồi Broadcast lại
     */
    @MessageMapping("/chat.sendMessage")
    public void processMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(new Date());
        
        ChatMessage savedMsg = chatMessageRepository.save(chatMessage);
        
        chatRoomRepository.findById(chatMessage.getRoomId()).ifPresent(room -> {
            room.setLastMessage(chatMessage.getContent());
            room.setLastUpdated(new Date());
            chatRoomRepository.save(room);
        });

        messagingTemplate.convertAndSend("/topic/chat/" + chatMessage.getRoomId(), savedMsg);
    }
}