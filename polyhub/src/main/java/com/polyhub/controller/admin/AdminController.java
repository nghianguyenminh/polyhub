package com.polyhub.controller.admin;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminController {

    // Map cả 2 đường dẫn /admin và /admin/dashboard về chung 1 trang
    @GetMapping({"", "/", "/dashboard"})
    public String dashboard() {
        return "admin/dashboard"; // Mở file templates/admin/dashboard.html
    }

    @GetMapping("/users")
    public String users() {
        return "admin/users"; // Mở file templates/admin/users.html
    }

    @GetMapping("/users/detail")
    public String userDetail() {
        return "admin/user_detail"; 
    }

    @GetMapping("/mentors")
    public String mentors() {
        return "admin/mentors"; 
    }

    @GetMapping("/mentors/detail")
    public String mentorDetail() {
        return "admin/mentor_detail"; 
    }

    @GetMapping("/groups")
    public String groups() {
        return "admin/groups"; 
    }

    @GetMapping("/documents")
    public String documents() {
        return "admin/documents"; 
    }

    @GetMapping("/reports")
    public String reports() {
        return "admin/reports"; 
    }


    
}