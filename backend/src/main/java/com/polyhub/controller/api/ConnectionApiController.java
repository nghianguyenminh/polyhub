package com.polyhub.controller.api;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.RequestStatus;
import com.polyhub.entity.User;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.FollowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/connections")
public class ConnectionApiController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorRequestRepository mentorRequestRepository;

    @Autowired
    private FollowService followService;

    @GetMapping
    public ResponseEntity<?> getConnections(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "") String keyword,
            Principal principal) {

        // 1. Fetch recommended Mentors
        Pageable mentorPageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<MentorRequest> recommendedMentors = mentorRequestRepository.findByStatus(RequestStatus.APPROVED, mentorPageable);
        List<Map<String, Object>> mentorsList = recommendedMentors.getContent().stream()
                .map(m -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", m.getId());
                    map.put("fullname", m.getFullname());
                    if (m.getUser() != null) {
                        map.put("user", Map.of(
                                "username", m.getUser().getUsername(),
                                "avatar", m.getUser().getAvatar() != null ? m.getUser().getAvatar() : ""
                        ));
                    }
                    return map;
                })
                .collect(Collectors.toList());

        // 2. Fetch Users
        Pageable userPageable = PageRequest.of(page - 1, size);
        Page<User> userPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            userPage = userRepository.findByFullnameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    keyword.trim(), keyword.trim(), userPageable);
        } else {
            userPage = userRepository.findAll(userPageable);
        }

        User currentUser = null;
        if (principal != null) {
            currentUser = userRepository.findById(principal.getName()).orElse(null);
        }

        final User finalCurrentUser = currentUser;
        List<Map<String, Object>> usersList = userPage.getContent().stream()
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("username", u.getUsername());
                    map.put("fullname", u.getFullname());
                    map.put("email", u.getEmail());
                    map.put("avatar", u.getAvatar());
                    map.put("major", u.getMajor());
                    map.put("bio", u.getBio());

                    boolean isFollowing = false;
                    boolean isSelf = false;
                    if (finalCurrentUser != null) {
                        isFollowing = u.getFollowers() != null && u.getFollowers().contains(finalCurrentUser);
                        isSelf = u.getUsername().equals(finalCurrentUser.getUsername());
                    }
                    map.put("isFollowing", isFollowing);
                    map.put("isSelf", isSelf);
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("users", usersList);
        response.put("recommendedMentors", mentorsList);
        response.put("currentPage", userPage.getNumber() + 1);
        response.put("totalPages", userPage.getTotalPages());
        response.put("totalElements", userPage.getTotalElements());
        response.put("keyword", keyword);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/follow")
    public ResponseEntity<?> toggleFollow(
            @RequestParam("targetUsername") String targetUsername,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Vui lòng đăng nhập để theo dõi!"));
        }

        User currentUser = userRepository.findById(principal.getName()).orElse(null);
        User targetUser = userRepository.findById(targetUsername).orElse(null);

        if (currentUser == null || targetUser == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Người dùng không tồn tại"));
        }

        if (currentUser.getUsername().equals(targetUser.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bạn không thể theo dõi chính mình"));
        }

        boolean isFollowing = targetUser.getFollowers() != null && targetUser.getFollowers().contains(currentUser);
        if (isFollowing) {
            followService.unfollow(currentUser.getUsername(), targetUser.getUsername());
            return ResponseEntity.ok(Map.of("isFollowing", false, "message", "Đã bỏ theo dõi " + targetUser.getFullname()));
        } else {
            followService.follow(currentUser.getUsername(), targetUser.getUsername());
            return ResponseEntity.ok(Map.of("isFollowing", true, "message", "Đã theo dõi " + targetUser.getFullname()));
        }
    }
}
