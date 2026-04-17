package com.polyhub.controller.admin;

import com.polyhub.entity.Category;
import com.polyhub.service.CategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin/categories")
public class CategoryAdminController {

    private final CategoryService categoryService;

    @GetMapping
    public String listCategories(Model model) {
        List<Category> categories = categoryService.getAllCategories();
        model.addAttribute("categories", categories);
        return "admin/categories";
    }

    @PostMapping("/add")
    public String addCategory(@RequestParam String name) {
        Category category = new Category();
        category.setName(name);
        categoryService.saveCategory(category);
        return "redirect:/admin/categories";
    }
}
