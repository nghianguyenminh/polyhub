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
        return "client/register";
    }
}