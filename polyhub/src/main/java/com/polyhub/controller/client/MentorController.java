package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.service.CategoryService;
import com.polyhub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class MentorController {

    private final CategoryService categoryService;
    private final UserService userService;

    @GetMapping("/mentors")
    public String index(Model model) {
        model.addAttribute("categories", categoryService.getActiveCategoriesForDropdown());
        List<User> mentors = userService.findByRole("MENTOR");
        model.addAttribute("mentors", mentors);
        return "client/mentors"; // Mở file src/main/resources/templates/client/mentors.html
    }

    @GetMapping("/mentors/{id}")
    public String detail(@PathVariable("id") String id, Model model) {
        User mentor = userService.findById(id).orElseThrow(() -> new IllegalArgumentException("Invalid mentor Id:" + id));
        model.addAttribute("mentor", mentor);
        return "client/mentor_detail"; // Mở file src/main/resources/templates/client/mentor_detail.html
    }
}
