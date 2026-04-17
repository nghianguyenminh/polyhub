package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.UserService;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/mentors")
public class MentorController {

    private final UserService userService;
    private final UserRepository userRepository;

    @ModelAttribute("currentUser")
    public User currentUser(Principal principal) {
        if (principal != null) {
            return userRepository.findByUsername(principal.getName()).orElse(null);
        }
        return null;
    }

    @GetMapping
    public String mentors(Model model, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            model.addAttribute("user", user);
        }
        List<User> mentors = userService.getApprovedMentors();
        model.addAttribute("mentors", mentors);
        return "client/mentors";
    }

    @GetMapping("/register")
    public String registerMentor(Model model, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            model.addAttribute("user", user);
        }
        return "client/mentor-register";
    }
}
