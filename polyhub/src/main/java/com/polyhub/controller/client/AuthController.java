package com.polyhub.controller.client;

import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.jpa.RoleRepository;
import com.polyhub.repository.jpa.UserRepository;
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

        // 4. Lấy Role "CLIENT" mặc định từ DB để gán cho User mới
        Role clientRole = roleRepository.findById("CLIENT").orElse(null);
        if (clientRole == null) {
            // Nếu trong DB chưa có role CLIENT thì tạo mới luôn để tránh lỗi
            clientRole = new Role("CLIENT", "Khách hàng");
            roleRepository.save(clientRole);
        }
        
        // 5. Gán các thông tin mặc định
        user.setRole(clientRole); // Phân quyền client mặc định
        user.setPassword(passwordEncoder.encode(user.getPassword())); // Mã hóa mật khẩu
        user.setAvatar("default.png"); // Ảnh đại diện mặc định
        user.setActive(true); // Trạng thái hoạt động
        user.setCreatedAt(java.time.LocalDateTime.now()); // Ngày tạo

        // 6. Lưu user vào DB
        userRepository.save(user);

        // Chuyển hướng sang trang đăng nhập cùng với thông báo thành công
        return "redirect:/login?success=true";
    }
}