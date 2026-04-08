package com.polyhub.controller.client;

import com.polyhub.dto.request.RegisterRequest;
import com.polyhub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class AuthController {

    @Autowired
    private UserService userService;

    @GetMapping("/login")
    public String login() {
        return "client/login";
    }

    @GetMapping("/register")
    public String showRegisterForm(Model model) {
        // Khởi tạo một đối tượng DTO rỗng để bind (gắn) với form trên HTML
        model.addAttribute("registerRequest", new RegisterRequest());
        return "client/register";
    }

    @PostMapping("/register")
    public String processRegister(@ModelAttribute("registerRequest") RegisterRequest request, Model model) {
        // Xử lý nghiệp vụ đăng ký nhận từ DTO
        String result = userService.registerUser(request);

        if (result.equals("success")) {
            // Nếu thành công, chuyển hướng sang màn hình đăng nhập với tham số success ở query string
            return "redirect:/login?registerSuccess=true";
        } else {
            // Nếu có lỗi (mật khẩu k khớp, trùng username...), đẩy lại đối tượng cùng thông báo lỗi về view register
            model.addAttribute("registerRequest", request); // Giữ lại thông tin đã nhập cho ng dùng (trừ pass)
            model.addAttribute("errorMessage", result);
            return "client/register";
        }
    }
}