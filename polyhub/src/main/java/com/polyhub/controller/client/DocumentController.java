package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import com.polyhub.service.CategoryService;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class DocumentController {
    
    private final CategoryService categoryService;

    @GetMapping("/documents")
    public String index(Model model) {
        model.addAttribute("categories", categoryService.getActiveCategoriesForDropdown());
        return "client/documents"; 
    } 
}
