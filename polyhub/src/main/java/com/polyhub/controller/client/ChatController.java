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

import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Controller
@RequiredArgsConstructor
public class ChatController {

    // Công cụ được Spring Boot cung cấp để Server bắn tin nhắn xuống trình duyệt
    private final SimpMessagingTemplate messagingTemplate;
    
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    
    @GetMapping("/chat")
    public String chatPage(@ModelAttribute("currentUser") User currentUser,
                           @RequestParam(value = "userId", required = false) String targetUserId, 
                           Model model) {
       
        if (currentUser == null) {
            return "redirect:/login";
        }

        ChatRoom room = null;
        User targetUser = null;
        
        if (targetUserId != null) {
            targetUser = userRepository.findById(targetUserId).orElse(null);
            if (targetUser != null) {
                room = chatRoomRepository.findByUsers(currentUser.getUsername(), targetUserId)
                        .orElseGet(() -> {
                            ChatRoom newRoom = ChatRoom.builder()
                                    .user1Id(currentUser.getUsername())
                                    .user2Id(targetUserId)
                                    .lastUpdated(new Date())
                                    .build();
                            return chatRoomRepository.save(newRoom);
                        });
                model.addAttribute("roomId", room.getId());
                model.addAttribute("targetUser", targetUser);
            }
        }
        
        // Fetch all rooms for current user
        List<ChatRoom> userRooms = chatRoomRepository.findByUserIdOrderByLastUpdatedDesc(currentUser.getUsername());
        Map<String, ChatRoom> userRoomMap = new HashMap<>();
        for (ChatRoom r : userRooms) {
            String otherUserId = r.getUser1Id().equals(currentUser.getUsername()) ? r.getUser2Id() : r.getUser1Id();
            userRoomMap.put(otherUserId, r);
        }

        List<User> allUsers = userRepository.findAll();
        List<User> sortedUsers = allUsers.stream()
                .filter(u -> !u.getUsername().equals(currentUser.getUsername())) // Bỏ qua chính mình
                .sorted((u1, u2) -> {
                    ChatRoom r1 = userRoomMap.get(u1.getUsername());
                    ChatRoom r2 = userRoomMap.get(u2.getUsername());
                    Date d1 = r1 != null ? r1.getLastUpdated() : null;
                    Date d2 = r2 != null ? r2.getLastUpdated() : null;

                    if (d1 != null && d2 != null) return d2.compareTo(d1); // Mới nhất lên đầu
                    if (d1 != null) return -1;
                    if (d2 != null) return 1;
                    
                    // Nếu chưa chat bao giờ, ai có tên trước thì lên trên
                    return u1.getFullname() != null && u2.getFullname() != null 
                        ? u1.getFullname().compareToIgnoreCase(u2.getFullname()) 
                        : 0;
                })
                .collect(Collectors.toList());

        model.addAttribute("allUsers", sortedUsers);
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("userRoomMap", userRoomMap); // Truyền map xuống giao diện để lấy lastMessage (tuỳ chọn)

        return "client/chat"; 
    }

   
    @GetMapping("/api/chat/history")
    @ResponseBody 
    public List<ChatMessage> getChatHistory(@RequestParam String roomId) {
        return chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId);
    }

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