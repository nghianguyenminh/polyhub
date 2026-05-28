package com.polyhub.controller.admin;

import com.polyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class DashboardController {

    private final UserRepository userRepository;

    @GetMapping
    public String dashboard(Model model) {
        model.addAttribute("totalUsers", userRepository.findAll().size());
        model.addAttribute("totalMentors", userRepository.countByRole_Id("MENTOR"));
        model.addAttribute("mentorRequests", userRepository.countByRole_Id("MENTOR_PENDING"));
        return "admin/dashboard";
    }
}
