package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.jpa.UserRepository;
import com.polyhub.service.EmailService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Random;

@Controller
public class ForgotPasswordController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.polyhub.service.OtpService otpService;

    @GetMapping("/forgot-password")
    public String forgotPasswordForm() {
        return "client/forgot_password";
    }

    @PostMapping("/forgot-password")
    public String processForgotPassword(@RequestParam("email") String email, HttpSession session, Model model) {
        User user = null;
        if (userRepository.existsByEmail(email)) {
            user = userRepository.findByEmail(email).orElse(null);
        }

        if (user == null) {
            model.addAttribute("error", "Email này không tồn tại trong hệ thống.");
            return "client/forgot_password";
        }

        // Tạo mã OTP ngẫu nhiên 6 số
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);

        // Gửi qua email
        emailService.sendOTPEmail(email, user.getFullname(), String.valueOf(otp));

        // Lưu thông tin reset và OTP service
        session.setAttribute("resetEmail", email);
        otpService.generateAndStoreOtp(email, String.valueOf(otp));

        return "redirect:/verify-otp";
    }

    @GetMapping("/verify-otp")
    public String verifyOtpForm(HttpSession session, Model model) {
        if (session.getAttribute("resetEmail") == null) {
            return "redirect:/forgot-password";
        }
        return "client/verify_otp";
    }

    @PostMapping("/verify-otp")
    public String processVerifyOtp(
            @RequestParam("otp") String otp,
            @RequestParam("newPassword") String newPassword,
            @RequestParam("confirmPassword") String confirmPassword,
            HttpSession session,
            Model model) {

        String resetEmail = (String) session.getAttribute("resetEmail");

        if (resetEmail == null) {
            return "redirect:/forgot-password";
        }

        if (!otpService.validateOtp(resetEmail, otp)) {
            model.addAttribute("error", "Mã OTP không chính xác hoặc đã hết hạn.");
            return "client/verify_otp";
        }

        if (!newPassword.equals(confirmPassword)) {
            model.addAttribute("error", "Mật khẩu xác nhận không khớp.");
            return "client/verify_otp";
        }
        
        if (newPassword.length() < 8) {
            model.addAttribute("error", "Mật khẩu mới phải có tối thiểu 8 ký tự.");
            return "client/verify_otp";
        }

        // Lấy ra user
        User user = userRepository.findByEmail(resetEmail).orElse(null);
        if (user != null) {
            // Thay đổi mật khẩu
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            // Xoá memory OTP và session
            otpService.clearOtp(resetEmail);
            session.removeAttribute("resetEmail");

            return "redirect:/login?resetSuccess=true";
        }

        model.addAttribute("error", "Có lỗi xảy ra, vui lòng thử lại.");
        return "client/verify_otp";
    }
}