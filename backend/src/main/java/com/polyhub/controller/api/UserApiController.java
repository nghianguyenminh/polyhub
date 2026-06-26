package com.polyhub.controller.api;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.FollowService;
import com.polyhub.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * REST API cho thông tin user: profile, avatar, cover, password, followers/following.
 */
@RestController
@RequestMapping("/api/users")
public class UserApiController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FollowService followService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * GET /api/users/{username} — Lấy thông tin profile của user.
     */
    @GetMapping("/{username}")
    public ResponseEntity<?> getUserProfile(@PathVariable String username, Principal principal) {
        User user = userRepository.findById(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy người dùng"));
        }

        Map<String, Object> response = buildUserProfileResponse(user, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/users/{username} — Cập nhật profile (fullname, phone, gender, birthday, bio, major).
     */
    @PutMapping("/{username}")
    public ResponseEntity<?> updateProfile(
            @PathVariable String username,
            @RequestBody Map<String, Object> request,
            Principal principal) {

        if (principal == null || !principal.getName().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Bạn không có quyền sửa profile này"));
        }

        User user = userRepository.findById(username).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (request.containsKey("fullname")) user.setFullname((String) request.get("fullname"));
        if (request.containsKey("phone")) user.setPhone((String) request.get("phone"));
        if (request.containsKey("gender")) user.setGender((Boolean) request.get("gender"));
        if (request.containsKey("bio")) user.setBio((String) request.get("bio"));
        if (request.containsKey("major")) user.setMajor((String) request.get("major"));
        if (request.containsKey("birthday") && request.get("birthday") != null) {
            user.setBirthday(java.time.LocalDate.parse((String) request.get("birthday")));
        }

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Cập nhật thành công", "user", buildUserProfileResponse(user, principal)));
    }

    /**
     * PUT /api/users/{username}/avatar — Đổi avatar.
     */
    @PutMapping("/{username}/avatar")
    public ResponseEntity<?> updateAvatar(
            @PathVariable String username,
            @RequestParam("avatar") MultipartFile file,
            Principal principal) {

        if (principal == null || !principal.getName().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Không có quyền"));
        }

        try {
            User user = userRepository.findById(username).orElse(null);
            if (user == null) return ResponseEntity.notFound().build();

            Map<String, Object> uploadResult = fileStorageService.uploadFile(file);
            user.setAvatar((String) uploadResult.get("url"));
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Đổi avatar thành công", "avatar", user.getAvatar()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/users/{username}/cover — Đổi ảnh bìa.
     */
    @PutMapping("/{username}/cover")
    public ResponseEntity<?> updateCover(
            @PathVariable String username,
            @RequestParam("cover") MultipartFile file,
            Principal principal) {

        if (principal == null || !principal.getName().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Không có quyền"));
        }

        try {
            User user = userRepository.findById(username).orElse(null);
            if (user == null) return ResponseEntity.notFound().build();

            Map<String, Object> uploadResult = fileStorageService.uploadFile(file);
            user.setCoverImage((String) uploadResult.get("url"));
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Đổi ảnh bìa thành công", "coverImage", user.getCoverImage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/users/{username}/password — Đổi mật khẩu.
     */
    @PutMapping("/{username}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable String username,
            @RequestBody Map<String, String> request,
            Principal principal) {

        if (principal == null || !principal.getName().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Không có quyền"));
        }

        User user = userRepository.findById(username).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu hiện tại không đúng"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

@PutMapping("/{username}/toggle-2fa")
@org.springframework.transaction.annotation.Transactional
public ResponseEntity<?> toggle2FA(@PathVariable("username") String username, @RequestBody Map<String, Boolean> request) {
    // 1. Tìm user mới nhất từ DB
    User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

    Boolean enable = request.get("enable");
    
    // 2. Set giá trị trực tiếp
    user.setIsTwoFactorEnabled(enable);
    
    if (!enable) {
        user.setTwoFactorCode(null);
        user.setTwoFactorCodeExpireTime(null);
    }

    // 3. Save và Flush để ép đẩy xuống DB ngay lập tức
    userRepository.saveAndFlush(user); 

    return ResponseEntity.ok(Map.of(
            "message", "Cập nhật thành công",
            "IsTwoFactorEnabled", enable
    ));
}

    /**
     * GET /api/users/{username}/followers — Danh sách followers.
     */
    @GetMapping("/{username}/followers")
    public ResponseEntity<?> getFollowers(@PathVariable String username) {
        User user = userRepository.findById(username).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> followers = user.getFollowers().stream()
                .map(this::buildSimpleUserMap)
                .collect(Collectors.toList());

        return ResponseEntity.ok(followers);
    }

    /**
     * GET /api/users/{username}/following — Danh sách following.
     */
    @GetMapping("/{username}/following")
    public ResponseEntity<?> getFollowing(@PathVariable String username) {
        User user = userRepository.findById(username).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> following = user.getFollowing().stream()
                .map(this::buildSimpleUserMap)
                .collect(Collectors.toList());

        return ResponseEntity.ok(following);
    }

    // ===== Helper Methods =====

    private Map<String, Object> buildUserProfileResponse(User user, Principal principal) {
        Map<String, Object> map = new HashMap<>();
        map.put("username", user.getUsername());
        map.put("fullname", user.getFullname());
        map.put("email", user.getEmail());
        map.put("phone", user.getPhone());
        map.put("gender", user.getGender());
        map.put("birthday", user.getBirthday());
        map.put("major", user.getMajor());
        map.put("avatar", user.getAvatar());
        map.put("coverImage", user.getCoverImage());
        map.put("bio", user.getBio());
        map.put("active", user.getActive());
        map.put("createdAt", user.getCreatedAt());
        map.put("role", user.getRole() != null ? user.getRole().getId() : null);
        map.put("followersCount", user.getFollowers() != null ? user.getFollowers().size() : 0);
        map.put("followingCount", user.getFollowing() != null ? user.getFollowing().size() : 0);
        map.put("IsTwoFactorEnabled", user.getIsTwoFactorEnabled() != null ? user.getIsTwoFactorEnabled() : false);

        // Kiểm tra xem user hiện tại có đang follow user này không
        if (principal != null) {
            User currentUser = userRepository.findById(principal.getName()).orElse(null);
            if (currentUser != null && user.getFollowers() != null) {
                map.put("isFollowing", user.getFollowers().contains(currentUser));
            } else {
                map.put("isFollowing", false);
            }
            map.put("isOwner", principal.getName().equals(user.getUsername()));
        } else {
            map.put("isFollowing", false);
            map.put("isOwner", false);
        }

        return map;
    }

    private Map<String, Object> buildSimpleUserMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("username", user.getUsername());
        map.put("fullname", user.getFullname());
        map.put("avatar", user.getAvatar());
        map.put("major", user.getMajor());
        return map;
    }
}
