package com.polyhub.controller.admin;

import com.polyhub.entity.Category;
import com.polyhub.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
public class CategoryAdminController {

    private final CategoryService categoryService;

    // Load View Admin -> categories.html
    @GetMapping
    public String showCategoriesForAdmin(Model model) {
        List<Category> categories = categoryService.getAllCategoriesForAdmin();
        model.addAttribute("majors", categories); // "majors" thay vì "tags"
        return "admin/categories";
    }

    // Action: Thêm mới Chuyên ngành (Form Submit)
    @PostMapping("/create")
    public String createMajor(
            @RequestParam("code") String code,
            @RequestParam("name") String name,
            RedirectAttributes redirectAttributes) {
        try {
            Category cat = new Category();
            cat.setCode(code);
            cat.setName(name);
            cat.setActive(true); // Default là hoạt động

            categoryService.createCategory(cat);
            redirectAttributes.addFlashAttribute("success_msg", "Thêm chuyên ngành thành công.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error_msg", "Lỗi: " + e.getMessage());
        }
        return "redirect:/admin/categories";
    }

    // Action: Khoá / Mở khoá chuyên ngành nhanh (Toggle)
    @PostMapping("/toggle-status/{id}")
    public String toggleStatus(@PathVariable("id") Long id, RedirectAttributes redirectAttributes) {
        try {
            categoryService.toggleStatus(id);
            redirectAttributes.addFlashAttribute("success_msg", "Cập nhật trạng thái thành công.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error_msg", "Lỗi chuyển trạng thái: " + e.getMessage());
        }
        return "redirect:/admin/categories";
    }

    // Action: Sửa đổi tên chuyên ngành
    @PostMapping("/edit/{id}")
    public String editMajor(
            @PathVariable("id") Long id,
            @RequestParam("name") String name,
            RedirectAttributes redirectAttributes) {
        try {
            Category updatePayload = new Category();
            updatePayload.setName(name);
            
            categoryService.updateCategory(id, updatePayload);
            redirectAttributes.addFlashAttribute("success_msg", "Sửa tên chuyên ngành thành công.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error_msg", "Không thể sửa chuyên ngành: " + e.getMessage());
        }
        return "redirect:/admin/categories";
    }

    // Action: Xóa chuyên ngành
    @PostMapping("/delete/{id}")
    public String deleteMajor(
            @PathVariable("id") Long id,
            RedirectAttributes redirectAttributes) {
        try {
            categoryService.deleteCategory(id);
            redirectAttributes.addFlashAttribute("success_msg", "Xóa chuyên ngành thành công.");
        } catch (IllegalStateException e) {
            redirectAttributes.addFlashAttribute("error_msg", e.getMessage());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error_msg", "Không thể xóa chuyên ngành: " + e.getMessage());
        }
        return "redirect:/admin/categories";
    }
}
