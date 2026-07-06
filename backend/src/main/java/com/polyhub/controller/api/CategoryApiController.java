package com.polyhub.controller.api;

import com.polyhub.entity.Category;
import com.polyhub.service.CategoryService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin("*")
public class CategoryApiController {

    private final CategoryService categoryService;

    // GET ALL (Dành cho Admin - Lấy toàn bộ danh mục bao gồm cả ẩn và hiện)
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(
                categoryService.getAllCategoriesForAdmin()
        );
    }

    // =========================================================================
    // ĐÃ SỬA: Gọi đúng hàm getActiveCategoriesForDropdown() có sẵn của bạn
    // =========================================================================
    @GetMapping("/active")
    public ResponseEntity<List<Category>> getActiveCategories() {
        try {
            return ResponseEntity.ok(
                    categoryService.getActiveCategoriesForDropdown()
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

}