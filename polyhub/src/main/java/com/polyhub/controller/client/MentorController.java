package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MentorController {
    @GetMapping("/mentors")
    public String index() {
        return "client/mentors"; // Mở file src/main/resources/templates/client/mentors.html
    }

    @GetMapping("/mentors/{id}")
    public String detail() {
        return "client/mentor_detail"; // Mở file src/main/resources/templates/client/mentor_detail.html
    }
}
