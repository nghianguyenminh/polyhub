package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthController {

    @GetMapping("/login")
    public String login() {
        return "client/login";
    }

    @GetMapping("/register")
    public String register() {
        // Có thể bổ sung sau, tạm thời redirect về login hoặc gọi trang đăng ký
        return "client/login";
    }
}