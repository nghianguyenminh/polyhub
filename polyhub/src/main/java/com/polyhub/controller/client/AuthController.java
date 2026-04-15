package com.polyhub.controller.client;

import com.polyhub.dto.request.RegisterRequest;
import com.polyhub.entity.User;
import com.polyhub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class AuthController {

    @Autowired
    private UserService userService;

    @GetMapping("/login")
    public String login() {
        return "client/login";
    }

    @GetMapping("/register")
    public String register(Model model) {
        model.addAttribute("user", new RegisterRequest());
        return "client/register";
    }

    @PostMapping("/register")
    public String processRegister(@ModelAttribute("user") RegisterRequest registerRequest, RedirectAttributes redirectAttributes) {
        try {
            userService.registerNewUser(registerRequest);
            redirectAttributes.addFlashAttribute("successMessage", "Đăng ký thành công!");
            return "redirect:/login";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/register";
        }
    }
}