package com.polyhub.service;

import com.polyhub.entity.Notification;
import com.polyhub.entity.User;
import com.polyhub.repository.NotificationRepository;
import com.polyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void createNotification(String recipientUsername, String senderUsername, String message, String type, Long targetId) {
        if (recipientUsername != null && recipientUsername.equals(senderUsername)) {
            // Don't send notification to self (e.g. self-liking, self-commenting)
            return;
        }

        User recipient = recipientUsername != null ? userRepository.findById(recipientUsername).orElse(null) : null;
        User sender = senderUsername != null ? userRepository.findById(senderUsername).orElse(null) : null;

        if (recipient != null) {
            Notification notification = Notification.builder()
                    .user(recipient)
                    .sender(sender)
                    .message(message)
                    .type(type)
                    .targetId(targetId)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        }
    }
}
