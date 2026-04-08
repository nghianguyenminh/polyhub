package com.polyhub.controller.client;

import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

@Controller
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // Dùng để mã hóa mật khẩu

    @GetMapping("/login")
    public String login() {
        return "client/login";
    }

    @GetMapping("/register")
    public String register(Model model) {
        // Gửi một đối tượng User rỗng sang form để binding dữ liệu
        model.addAttribute("user", new User());
        return "client/register";
    }

    @PostMapping("/register")
    public String processRegister(@ModelAttribute("user") User user, String confirmPassword, Model model) {
        
        // 1. Kiểm tra mật khẩu xác nhận
        if (!user.getPassword().equals(confirmPassword)) {
            model.addAttribute("error", "Mật khẩu xác nhận không khớp!");
            return "client/register";
        }

        // 2. Kiểm tra tên đăng nhập (Mã sinh viên) đã tồn tại chưa
        if (userRepository.existsById(user.getUsername())) {
            model.addAttribute("error", "Mã sinh viên này đã được đăng ký!");
            return "client/register";
        }

        // 3. Kiểm tra email đã được sử dụng chưa
        if (userRepository.existsByEmail(user.getEmail())) {
            model.addAttribute("error", "Email này đã được sử dụng!");
            return "client/register";
        }

        // 4. Lấy Role "STUDENT" mặc định từ DB để gán cho User mới
        Role studentRole = roleRepository.findById("STUDENT").orElse(null);
        if (studentRole == null) {
            // Nếu trong DB chưa có role STUDENT thì tạo mới luôn để tránh lỗi
            studentRole = new Role("STUDENT", "Sinh viên");
            roleRepository.save(studentRole);
        }
        
        // 5. Gán các thông tin mặc định
        user.setRole(studentRole); // Phân quyền sinh viên mặc định
        user.setPassword(passwordEncoder.encode(user.getPassword())); // Mã hóa mật khẩu
        user.setAvatar("default.png"); // Ảnh đại diện mặc định
        user.setActive(true); // Trạng thái hoạt động
        user.setCreatedAt(new java.util.Date()); // Ngày tạo

        // 6. Lưu user vào DB
        userRepository.save(user);

        // Chuyển hướng sang trang đăng nhập cùng với thông báo thành công
        return "redirect:/login?success=true";
    }
}