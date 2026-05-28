package com.polyhub.controller.api;

import com.polyhub.entity.User;
import com.polyhub.entity.chat.ChatRoom;
import com.polyhub.repository.ChatRoomRepository;
import com.polyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat-data")
@RequiredArgsConstructor
public class ChatApiController {

    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;

    @GetMapping
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
}
