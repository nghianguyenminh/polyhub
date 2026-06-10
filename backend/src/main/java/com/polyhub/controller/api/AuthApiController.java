package com.polyhub.controller.api;

import com.polyhub.config.JwtService;
import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import com.polyhub.service.EmailService;
import com.polyhub.service.OtpService;

/**
 * REST API cho xác thực: Login (trả JWT), Register, lấy thông tin user hiện tại.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpService otpService;

    /**
     * POST /api/auth/login
     * Body: { "username": "...", "password": "..." }
     * Response: { "token": "...", "user": { ... } }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username và password không được để trống"));
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            String token = jwtService.generateToken(userDetails);

            // Lấy thông tin user đầy đủ
            User user = userRepository.findByUsernameOrEmail(username, username).orElse(null);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", buildUserResponse(user));

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Sai tên đăng nhập hoặc mật khẩu"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Đã xảy ra lỗi: " + e.getMessage()));
        }
    }

    /**
     * POST /api/auth/register
     * Body: { "username": "...", "password": "...", "confirmPassword": "...", "fullname": "...", "email": "..." }
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String confirmPassword = request.get("confirmPassword");
        String fullname = request.get("fullname");
        String email = request.get("email");

        // Validation
        if (username == null || password == null || fullname == null || email == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng điền đầy đủ thông tin"));
        }

        if (!password.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu xác nhận không khớp!"));
        }

        if (userRepository.existsById(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mã sinh viên này đã được đăng ký!"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email này đã được sử dụng!"));
        }

        // Lấy Role "CLIENT" mặc định
        Role clientRole = roleRepository.findById("CLIENT").orElse(null);
        if (clientRole == null) {
            clientRole = new Role("CLIENT", "Khách hàng");
            roleRepository.save(clientRole);
        }

        String phone = request.get("phone");
        String birthdayStr = request.get("birthday");

        // Tạo user mới
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullname(fullname);
        user.setEmail(email);
        user.setRole(clientRole);
        user.setAvatar("default.png");
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());

        if (phone != null && !phone.trim().isEmpty()) {
            user.setPhone(phone.trim());
        }
        if (birthdayStr != null && !birthdayStr.trim().isEmpty()) {
            try {
                user.setBirthday(java.time.LocalDate.parse(birthdayStr));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ngày sinh không đúng định dạng (yyyy-MM-dd)."));
            }
        }

        userRepository.save(user);

        // Tạo JWT token luôn cho user mới
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String token = jwtService.generateToken(userDetails);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", buildUserResponse(user));
        response.put("message", "Đăng ký thành công!");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/auth/me — Lấy thông tin user đang đăng nhập (cần JWT).
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Chưa đăng nhập"));
        }

        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy user"));
        }

        return ResponseEntity.ok(buildUserResponse(user));
    }

    /**
     * Helper: Build user response map (loại bỏ password và thông tin nhạy cảm).
     */
    private Map<String, Object> buildUserResponse(User user) {
        if (user == null) return Map.of();

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
        return map;
    }

    /**
     * POST /api/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email không được để trống"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email này không tồn tại trong hệ thống."));
        }

        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);

        emailService.sendOTPEmail(email, user.getFullname(), String.valueOf(otp));
        otpService.generateAndStoreOtp(email, String.valueOf(otp));

        return ResponseEntity.ok(Map.of("message", "Mã OTP đã được gửi đến email của bạn."));
    }

    /**
     * POST /api/auth/verify-otp
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");
        String confirmPassword = request.get("confirmPassword");

        if (email == null || otp == null || newPassword == null || confirmPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng nhập đầy đủ thông tin"));
        }

        if (!otpService.validateOtp(email, otp)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mã OTP không chính xác hoặc đã hết hạn."));
        }

        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu xác nhận không khớp."));
        }

        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu mới phải có tối thiểu 8 ký tự."));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            otpService.clearOtp(email);
            return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công."));
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Có lỗi xảy ra, vui lòng thử lại."));
    }
}
