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
import com.polyhub.service.SmsService;

@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    @Autowired
    private SmsService smsService;

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

        User user = userRepository.findByUsernameOrEmail(username, username).orElse(null);

        if (user != null && Boolean.TRUE.equals(user.getIsTwoFactorEnabled())) {
            Random random = new Random();
            int otpNumber = 100000 + random.nextInt(900000);
            String otp = String.valueOf(otpNumber);

            user.setTwoFactorCode(otp);
            user.setTwoFactorCodeExpireTime(LocalDateTime.now().plusMinutes(5));
            userRepository.save(user);

            emailService.send2FAEmail(user.getEmail(), user.getFullname(), otp);

            Map<String, Object> response2FA = new HashMap<>();
            response2FA.put("status", "REQUIRES_2FA");
            response2FA.put("message", "Mã xác minh đã được gửi đến email");
            response2FA.put("username", user.getUsername());
            response2FA.put("email", user.getEmail());
            
            if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                response2FA.put("phone", user.getPhone());
            }

            return ResponseEntity.ok(response2FA);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String token = jwtService.generateToken(userDetails);

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

    @PostMapping("/send-2fa-sms")
    public ResponseEntity<?> send2FASms(@RequestBody Map<String, String> request) {
        String username = request.get("username");

        if (username == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username không được để trống"));
        }

        User user = userRepository.findByUsernameOrEmail(username, username).orElse(null);

        if (user == null || user.getPhone() == null || user.getPhone().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Số điện thoại không khả dụng"));
        }

        Random random = new Random();
        int otpNumber = 100000 + random.nextInt(900000);
        String otp = String.valueOf(otpNumber);

        user.setTwoFactorCode(otp);
        user.setTwoFactorCodeExpireTime(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        smsService.sendSms(user.getPhone(), otp);

        return ResponseEntity.ok(Map.of(
                "status", "SMS_SENT",
                "message", "Mã xác minh đã được gửi qua SMS"
        ));
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verify2fa(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String code = request.get("code");

        if (username == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng cung cấp username và mã xác minh"));
        }

        User user = userRepository.findByUsernameOrEmail(username, username).orElse(null);

        if (user == null || user.getTwoFactorCode() == null || !user.getTwoFactorCode().equals(code)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mã xác minh không chính xác"));
        }

        if (user.getTwoFactorCodeExpireTime() == null || user.getTwoFactorCodeExpireTime().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mã xác minh đã hết hạn"));
        }

        user.setTwoFactorCode(null);
        user.setTwoFactorCodeExpireTime(null);
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtService.generateToken(userDetails);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", buildUserResponse(user));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String confirmPassword = request.get("confirmPassword");
        String fullname = request.get("fullname");
        String email = request.get("email");

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

        Role clientRole = roleRepository.findById("CLIENT").orElse(null);
        if (clientRole == null) {
            clientRole = new Role("CLIENT", "Khách hàng");
            roleRepository.save(clientRole);
        }

        String phone = request.get("phone");
        String birthdayStr = request.get("birthday");

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

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String token = jwtService.generateToken(userDetails);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", buildUserResponse(user));
        response.put("message", "Đăng ký thành công!");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

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
        map.put("IsTwoFactorEnabled", user.getIsTwoFactorEnabled() != null ? user.getIsTwoFactorEnabled() : false);
        
        return map;
    }

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