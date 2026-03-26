package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginController {

    @GetMapping("/login")
    public String login() {
        return "client/login"; // Mở file src/main/resources/templates/client/login.html
    }
}