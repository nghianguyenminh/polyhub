package com.polyhub.controller.api.admin;

import com.polyhub.entity.Category;
import com.polyhub.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryApiController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<?> getCategories() {
        List<Category> categories = categoryService.getAllCategoriesForAdmin();
        return ResponseEntity.ok(categories);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createCategory(@RequestBody Map<String, String> payload) {
        try {
            String code = payload.get("code");
            String name = payload.get("name");
            
            Category cat = new Category();
            cat.setCode(code);
            cat.setName(name);
            cat.setActive(true);

            categoryService.createCategory(cat);
            return ResponseEntity.ok(Map.of("message", "Thêm chuyên ngành thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PostMapping("/toggle-status/{id}")
    public ResponseEntity<?> toggleStatus(@PathVariable("id") Long id) {
        try {
            categoryService.toggleStatus(id);
            return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi chuyển trạng thái: " + e.getMessage()));
        }
    }

    @PostMapping("/edit/{id}")
    public ResponseEntity<?> editCategory(@PathVariable("id") Long id, @RequestBody Map<String, String> payload) {
        try {
            String name = payload.get("name");
            Category updatePayload = new Category();
            updatePayload.setName(name);
            
            categoryService.updateCategory(id, updatePayload);
            return ResponseEntity.ok(Map.of("message", "Sửa tên chuyên ngành thành công."));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Không thể sửa chuyên ngành: " + e.getMessage()));
        }
    }

    @PostMapping("/delete/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable("id") Long id) {
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.ok(Map.of("message", "Xóa chuyên ngành thành công."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Không thể xóa chuyên ngành: " + e.getMessage()));
        }
    }
}
