package com.polyhub.controller.api;

import com.polyhub.entity.Category;
import com.polyhub.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryApiController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<?> getActiveCategories() {
        List<Category> categories = categoryService.getActiveCategoriesForDropdown();
        return ResponseEntity.ok(categories);
    }
}
