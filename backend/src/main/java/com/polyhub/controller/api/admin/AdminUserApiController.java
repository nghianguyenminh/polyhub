package com.polyhub.controller.api.admin;

import com.polyhub.entity.User;
import com.polyhub.entity.Role;
import com.polyhub.repository.UserRepository;
import com.polyhub.repository.RoleRepository;
import com.polyhub.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN', 'CONTENT_ADMIN')")
public class AdminUserApiController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active) {
            
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        String searchKeyword = (keyword == null || keyword.trim().isEmpty()) ? null : keyword.trim();
        String searchRole = (role == null || role.trim().isEmpty() || role.equalsIgnoreCase("All")) ? null : role.trim();

        Page<User> userPage = userRepository.findByFilters(searchKeyword, searchRole, active, pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("users", userPage.getContent());
        response.put("currentPage", page);
        response.put("totalPages", userPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserDetail(@PathVariable("id") String username) {
        if (username.equalsIgnoreCase("superadmin")) {
            return ResponseEntity.status(403).body("Không thể xem chi tiết tài khoản Super Admin");
        }
        User user = userRepository.findById(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        if (user.getRole() != null && user.getRole().getId().equalsIgnoreCase("SUPER_ADMIN")) {
            return ResponseEntity.status(403).body("Không thể xem chi tiết tài khoản Super Admin");
        }
        
        long userAdminCount = userRepository.countByRole_Id("USER_ADMIN");
        long contentAdminCount = userRepository.countByRole_Id("CONTENT_ADMIN");
        
        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("userAdminCount", userAdminCount);
        response.put("contentAdminCount", contentAdminCount);
        response.put("MAX_USER_ADMIN", 2);
        response.put("MAX_CONTENT_ADMIN", 2);

        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN')")
    @PostMapping("/lock/{id}")
    public ResponseEntity<?> lockUser(@PathVariable("id") String username, 
                                      @RequestBody Map<String, String> body) {
        if (username.equalsIgnoreCase("superadmin")) {
            return ResponseEntity.status(403).body("Không thể khóa tài khoản Super Admin");
        }
        String reason = body.get("reason");
        User user = userRepository.findById(username).orElse(null);
        if (user != null && user.getRole() != null && user.getRole().getId().equalsIgnoreCase("SUPER_ADMIN")) {
            return ResponseEntity.status(403).body("Không thể khóa tài khoản Super Admin");
        }
        if (user != null && user.getActive()) {
            user.setActive(false);
            userRepository.save(user);
            emailService.sendAccountLockEmail(user.getEmail(), user.getFullname(), reason);
            return ResponseEntity.ok(Map.of("message", "Đã khóa người dùng " + username + " thành công."));
        }
        return ResponseEntity.status(400).body("Không thể khóa tài khoản");
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN')")
    @PostMapping("/unlock/{id}")
    public ResponseEntity<?> unlockUser(@PathVariable("id") String username) {
        if (username.equalsIgnoreCase("superadmin")) {
            return ResponseEntity.status(403).body("Không thể mở khóa tài khoản Super Admin");
        }
        User user = userRepository.findById(username).orElse(null);
        if (user != null && user.getRole() != null && user.getRole().getId().equalsIgnoreCase("SUPER_ADMIN")) {
            return ResponseEntity.status(403).body("Không thể mở khóa tài khoản Super Admin");
        }
        if (user != null && !user.getActive()) {
            user.setActive(true);
            userRepository.save(user);
            emailService.sendAccountUnlockEmail(user.getEmail(), user.getFullname());
            return ResponseEntity.ok(Map.of("message", "Đã mở khóa người dùng " + username + " thành công."));
        }
        return ResponseEntity.status(400).body("Không thể mở khóa tài khoản");
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @PostMapping("/roles/{id}")
    public ResponseEntity<?> changeRole(@PathVariable("id") String username,
                                        @RequestBody Map<String, String> body) {
        if (username.equalsIgnoreCase("superadmin")) {
            return ResponseEntity.status(403).body("Không thể thay đổi quyền của tài khoản Super Admin");
        }
        String roleId = body.get("roleId");
        User user = userRepository.findById(username).orElse(null);
        Role role = roleRepository.findById(roleId).orElse(null);
        if (user != null && user.getRole() != null && user.getRole().getId().equalsIgnoreCase("SUPER_ADMIN")) {
            return ResponseEntity.status(403).body("Không thể thay đổi quyền của tài khoản Super Admin");
        }
        
        if (user != null && role != null) {
            if (roleId.equals("USER_ADMIN") && (user.getRole() == null || !user.getRole().getId().equals("USER_ADMIN"))) {
                long current = userRepository.countByRole_Id("USER_ADMIN");
                if (current >= 2) {
                    return ResponseEntity.status(400).body("Đã đạt giới hạn số lượng Admin Quản lý Người dùng (Maximum 2).");
                }
            } else if (roleId.equals("CONTENT_ADMIN") && (user.getRole() == null || !user.getRole().getId().equals("CONTENT_ADMIN"))) {
                long current = userRepository.countByRole_Id("CONTENT_ADMIN");
                if (current >= 2) {
                    return ResponseEntity.status(400).body("Đã đạt giới hạn số lượng Admin Quản lý Nội dung (Maximum 2).");
                }
            }

            user.setRole(role);
            userRepository.save(user);
            emailService.sendRoleAssignmentEmail(user.getEmail(), user.getFullname(), role.getName());
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật quyền thành công."));
        }
        return ResponseEntity.status(400).body("Cập nhật quyền thất bại.");
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String fullname = body.get("fullname");
        String email = body.get("email");
        String password = body.get("password");
        String roleId = body.get("roleId");

        if (username == null || username.trim().isEmpty() ||
            fullname == null || fullname.trim().isEmpty() ||
            email == null || email.trim().isEmpty() ||
            password == null || password.trim().isEmpty() ||
            roleId == null || roleId.trim().isEmpty()) {
            return ResponseEntity.status(400).body("Vui lòng điền đầy đủ các thông tin bắt buộc.");
        }

        username = username.trim().toLowerCase();
        email = email.trim().toLowerCase();

        if (userRepository.existsById(username)) {
            return ResponseEntity.status(400).body("Tên đăng nhập đã tồn tại.");
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(400).body("Email đã tồn tại.");
        }

        Role role = roleRepository.findById(roleId).orElse(null);
        if (role == null) {
            return ResponseEntity.status(400).body("Vai trò không hợp lệ.");
        }

        // Limit validation for USER_ADMIN and CONTENT_ADMIN
        if (roleId.equals("USER_ADMIN")) {
            long current = userRepository.countByRole_Id("USER_ADMIN");
            if (current >= 2) {
                return ResponseEntity.status(400).body("Đã đạt giới hạn số lượng Admin Quản lý Người dùng (Maximum 2).");
            }
        } else if (roleId.equals("CONTENT_ADMIN")) {
            long current = userRepository.countByRole_Id("CONTENT_ADMIN");
            if (current >= 2) {
                return ResponseEntity.status(400).body("Đã đạt giới hạn số lượng Admin Quản lý Nội dung (Maximum 2).");
            }
        }

        String phone = body.get("phone");
        String birthdayStr = body.get("birthday");

        User user = new User();
        user.setUsername(username);
        user.setFullname(fullname.trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setActive(true);

        if (phone != null && !phone.trim().isEmpty()) {
            user.setPhone(phone.trim());
        }
        if (birthdayStr != null && !birthdayStr.trim().isEmpty()) {
            try {
                user.setBirthday(java.time.LocalDate.parse(birthdayStr));
            } catch (Exception e) {
                return ResponseEntity.status(400).body("Ngày sinh không đúng định dạng (yyyy-MM-dd).");
            }
        }

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Tạo tài khoản thành công."));
    }
}
