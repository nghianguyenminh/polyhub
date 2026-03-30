package com.polyhub.controller.admin;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class Dashboard {
    @GetMapping("/admin")
    public String dashboard() {
        return "admin/dashboard";
    }
}
