package com.polyhub.controller.api;

import com.polyhub.entity.User;
import com.polyhub.entity.chat.ChatRoom;
import com.polyhub.entity.chat.ChatMessage;
import com.polyhub.repository.ChatRoomRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ChatApiController {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/api/chat-data")
    public ResponseEntity<?> getChatData(@RequestParam(value = "userId", required = false) String targetUserId, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        String username = principal.getName();
        User currentUser = userRepository.findById(username).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(401).body("User not found");
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
            }
        }
        
        List<ChatRoom> userRooms = chatRoomRepository.findByUserIdOrderByLastUpdatedDesc(currentUser.getUsername());
        Map<String, ChatRoom> userRoomMap = new HashMap<>();
        Set<String> chattedUserIds = new HashSet<>(); 
        
        for (ChatRoom r : userRooms) {
            String otherUserId = r.getUser1Id().equals(currentUser.getUsername()) ? r.getUser2Id() : r.getUser1Id();
            userRoomMap.put(otherUserId, r);
            chattedUserIds.add(otherUserId);
        }

        if (targetUser != null) {
            chattedUserIds.add(targetUser.getUsername());
            if (!userRoomMap.containsKey(targetUser.getUsername()) && room != null) {
                userRoomMap.put(targetUser.getUsername(), room);
            }
        }

        List<User> chattedUsers = chattedUserIds.isEmpty() ? List.of() : userRepository.findAllById(chattedUserIds);
        List<User> followedUsers = userRepository.findByFollowers_Username(currentUser.getUsername());
        Set<User> combinedUsers = new HashSet<>();
        combinedUsers.addAll(chattedUsers); 
        combinedUsers.addAll(followedUsers);

        List<Map<String, Object>> sortedUsers = combinedUsers.stream()
                .filter(u -> !u.getUsername().equals(currentUser.getUsername()))
                .sorted((u1, u2) -> {
                    ChatRoom r1 = userRoomMap.get(u1.getUsername());
                    ChatRoom r2 = userRoomMap.get(u2.getUsername());
                    Date d1 = r1 != null ? r1.getLastUpdated() : null;
                    Date d2 = r2 != null ? r2.getLastUpdated() : null;

                    if (d1 != null && d2 != null) return d2.compareTo(d1); 
                    if (d1 != null) return -1;
                    if (d2 != null) return 1;
                    
                    return u1.getFullname() != null && u2.getFullname() != null 
                        ? u1.getFullname().compareToIgnoreCase(u2.getFullname()) 
                        : 0;
                })
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("username", u.getUsername());
                    map.put("fullname", u.getFullname());
                    map.put("avatar", u.getAvatar());
                    ChatRoom r = userRoomMap.get(u.getUsername());
                    if (r != null) {
                        map.put("lastMessage", r.getLastMessage());
                        map.put("lastSenderId", r.getLastSenderId());
                        map.put("isLastMessageRead", r.isLastMessageRead());
                        map.put("roomId", r.getId());
                        map.put("lastUpdated", r.getLastUpdated()); // Fix: thêm để frontend sort sidebar đúng khi load
                    }
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("allUsers", sortedUsers);
        
        if (targetUser != null) {
            Map<String, Object> targetMap = new HashMap<>();
            targetMap.put("username", targetUser.getUsername());
            targetMap.put("fullname", targetUser.getFullname());
            targetMap.put("avatar", targetUser.getAvatar());
            response.put("targetUser", targetMap);
        }
        
        if (room != null) {
            response.put("roomId", room.getId());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/chat/history")
    public List<ChatMessage> getChatHistory(@RequestParam String roomId) {
        return chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId);
    }

    @MessageMapping("/chat.sendMessage")
    public void processMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(new Date());

        String type = chatMessage.getType() != null ? chatMessage.getType() : "TEXT";

        // ── Tín hiệu điều khiển: CALL_OFFER, CALL_REJECT ──────────────────────────
        // Chỉ relay qua WebSocket, KHÔNG lưu vào Database và KHÔNG cập nhật sidebar.
        if ("CALL_OFFER".equals(type) || "CALL_REJECT".equals(type)) {
            messagingTemplate.convertAndSend("/topic/chat/" + chatMessage.getRoomId(), chatMessage);
            return;
        }

        // ── Lưu vào Database ────────────────────────────────────────────────────────
        ChatMessage savedMsg = chatMessageRepository.save(chatMessage);

        // ── Cập nhật ChatRoom (chỉ cho TEXT và CALL_ENDED) ─────────────────────────
        chatRoomRepository.findById(chatMessage.getRoomId()).ifPresent(room -> {
            if ("TEXT".equals(type)) {
                // Chỉ tin nhắn TEXT mới được hiển thị ở preview sidebar
                room.setLastMessage(chatMessage.getContent());
                room.setLastSenderId(chatMessage.getSenderId());
                room.setLastMessageRead(false);
            }
            // Luôn cập nhật lastUpdated để đẩy conversation lên đầu sidebar
            room.setLastUpdated(new Date());
            chatRoomRepository.save(room);
        });

        messagingTemplate.convertAndSend("/topic/chat/" + chatMessage.getRoomId(), savedMsg);
    }
}

