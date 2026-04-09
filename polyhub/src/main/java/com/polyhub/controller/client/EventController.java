package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/events")
public class EventController {

    @GetMapping
    public String index(Model model) {
        model.addAttribute("pageTitle", "Sự kiện FPT Polytechnic - PolyHUB");
        return "client/events";
    }
}