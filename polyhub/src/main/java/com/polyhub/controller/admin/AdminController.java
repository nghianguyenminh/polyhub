package com.polyhub.controller.admin;

import com.polyhub.entity.User;
import com.polyhub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    // Map cả 2 đường dẫn /admin và /admin/dashboard về chung 1 trang
    @GetMapping({"", "/", "/dashboard"})
    public String dashboard() {
        return "admin/dashboard"; // Mở file templates/admin/dashboard.html
    }

    @GetMapping("/users/detail")
    public String userDetail() {
        return "admin/user_detail";
    }

    @GetMapping("/mentors")
    public String mentors(Model model) {
        List<User> mentors = userService.findByRole("MENTOR");
        model.addAttribute("mentors", mentors);
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

    @GetMapping("/reports")
    public String reports() {
        return "admin/reports";
    }


}
