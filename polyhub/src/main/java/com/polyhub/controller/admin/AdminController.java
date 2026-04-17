package com.polyhub.controller.admin;

import com.polyhub.entity.User;
import com.polyhub.service.UserService;
import java.util.List;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        return "admin/dashboard";
    }

    @GetMapping("/users")
    public String users(Model model) {
        List<User> users = userService.getAllUsers();
        model.addAttribute("users", users);
        return "admin/users";
    }

    @GetMapping("/mentors")
    public String mentors(Model model) {
        List<User> mentors = userService.getMentors();
        model.addAttribute("mentors", mentors);
        return "admin/mentors";
    }

    @GetMapping("/mentor-requests")
    public String mentorRequests(Model model) {
        List<User> mentorRequests = userService.getMentorRequests();
        model.addAttribute("mentorRequests", mentorRequests);
        return "admin/mentor-requests";
    }

    @PostMapping("/approve-mentor/{id}")
    public String approveMentor(@PathVariable Long id) {
        userService.approveMentorRequest(id);
        return "redirect:/admin/mentor-requests";
    }

    @PostMapping("/reject-mentor/{id}")
    public String rejectMentor(@PathVariable Long id, @RequestParam String rejectionReason) {
        userService.rejectMentorRequest(id, rejectionReason);
        return "redirect:/admin/mentor-requests";
    }
}
