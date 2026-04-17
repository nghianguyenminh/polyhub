package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/mentors")
public class MentorController {

    private final UserService userService;

    @GetMapping
    public String mentors(Model model) {
        List<User> mentors = userService.getMentors();
        model.addAttribute("mentors", mentors);
        return "client/mentors";
    }
}
