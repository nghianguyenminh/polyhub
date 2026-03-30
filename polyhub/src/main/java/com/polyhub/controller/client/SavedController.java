package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/saved")
public class SavedController {

    @GetMapping
    public String index(Model model) {
        model.addAttribute("pageTitle", "Mục đã lưu - PolyHUB");
        // Dữ liệu mẫu cho Sidebar bên trái
        return "client/saved";
    }
}