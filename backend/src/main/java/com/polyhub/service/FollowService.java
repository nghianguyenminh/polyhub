package com.polyhub.service;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class FollowService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public void follow(String fromUsername, String toUsername) {
        Optional<User> fromUserOptional = userRepository.findById(fromUsername);
        Optional<User> toUserOptional = userRepository.findById(toUsername);

        if (fromUserOptional.isPresent() && toUserOptional.isPresent()) {
            User fromUser = fromUserOptional.get();
            User toUser = toUserOptional.get();

            fromUser.getFollowing().add(toUser);
            toUser.getFollowers().add(fromUser);

            userRepository.save(fromUser);
            userRepository.save(toUser);

            notificationService.createNotification(
                toUsername,
                fromUsername,
                "đã bắt đầu theo dõi bạn.",
                "FOLLOW",
                null
            );
        }
    }

    public void unfollow(String fromUsername, String toUsername) {
        Optional<User> fromUserOptional = userRepository.findById(fromUsername);
        Optional<User> toUserOptional = userRepository.findById(toUsername);

        if (fromUserOptional.isPresent() && toUserOptional.isPresent()) {
            User fromUser = fromUserOptional.get();
            User toUser = toUserOptional.get();

            fromUser.getFollowing().remove(toUser);
            toUser.getFollowers().remove(fromUser);

            userRepository.save(fromUser);
            userRepository.save(toUser);
        }
    }
}
