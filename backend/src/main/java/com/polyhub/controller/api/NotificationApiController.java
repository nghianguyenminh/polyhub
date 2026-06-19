package com.polyhub.controller.api;

import com.polyhub.entity.Notification;
import com.polyhub.entity.User;
import com.polyhub.repository.NotificationRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationApiController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }
        List<Notification> list = notificationRepository.findByUserUsernameOrderByCreatedAtDesc(principal.getName());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }
        long count = notificationRepository.countByUserUsernameAndIsReadFalse(principal.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/read")
    @Transactional
    public ResponseEntity<?> markAsRead(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }
        List<Notification> unreadList = notificationRepository.findByUserUsernameAndIsReadFalse(principal.getName());
        for (Notification n : unreadList) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unreadList);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đọc tất cả thông báo"));
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<?> markSingleAsRead(@PathVariable("id") Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }
        Notification n = notificationRepository.findById(id).orElse(null);
        if (n == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy thông báo"));
        }
        if (!n.getUser().getUsername().equalsIgnoreCase(principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Không có quyền"));
        }
        n.setIsRead(true);
        notificationRepository.save(n);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đọc thông báo"));
    }
}
