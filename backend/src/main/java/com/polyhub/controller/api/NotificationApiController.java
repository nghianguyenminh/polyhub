package com.polyhub.controller.api;

import com.polyhub.entity.Notification;
import com.polyhub.entity.User;
import com.polyhub.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationApiController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String username = principal.getName();
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<Notification> notiPage = notificationRepository.findByUserUsernameOrderByCreatedAtDesc(username, pageable);
        long unreadCount = notificationRepository.countByUserUsernameAndIsReadFalse(username);

        List<Map<String, Object>> notiList = new ArrayList<>();
        for (Notification noti : notiPage.getContent()) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", noti.getId());
            map.put("message", noti.getMessage());
            map.put("isRead", noti.getIsRead());
            map.put("type", noti.getType());
            map.put("targetId", noti.getTargetId());
            map.put("createdAt", noti.getCreatedAt());
            
            if (noti.getSender() != null) {
                Map<String, Object> senderMap = new HashMap<>();
                senderMap.put("username", noti.getSender().getUsername());
                senderMap.put("fullname", noti.getSender().getFullname());
                senderMap.put("avatar", noti.getSender().getAvatar());
                map.put("sender", senderMap);
            }
            notiList.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notiList);
        response.put("currentPage", page);
        response.put("totalPages", notiPage.getTotalPages());
        response.put("unreadCount", unreadCount);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Notification notification = notificationRepository.findById(id).orElse(null);
        if (notification != null && notification.getUser().getUsername().equals(principal.getName())) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.status(400).body(Map.of("error", "Notification not found"));
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        notificationRepository.markAllAsRead(principal.getName());
        return ResponseEntity.ok(Map.of("success", true));
    }
}
