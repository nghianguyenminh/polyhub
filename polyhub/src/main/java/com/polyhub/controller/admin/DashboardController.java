package com.polyhub.controller.admin;

import com.polyhub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class DashboardController {

    private final UserService userService;

    @GetMapping
    public String dashboard(Model model) {
        model.addAttribute("totalUsers", userService.getAllUsers().size());
        model.addAttribute("totalMentors", userService.getMentors().size());
        model.addAttribute("mentorRequests", userService.getMentorRequests().size());
        return "admin/dashboard";
    }
}
