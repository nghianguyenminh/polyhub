package com.polyhub.controller.admin;

import com.polyhub.entity.Category;
import com.polyhub.entity.Document;
import com.polyhub.entity.DocumentStatus;
import com.polyhub.service.CategoryService;
import com.polyhub.service.admin.DocumentAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/admin/documents")
@RequiredArgsConstructor
public class DocumentAdminController {

    private final DocumentAdminService documentAdminService;
    private final CategoryService categoryService;

    @GetMapping
    public String index(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category_id", required = false) Long categoryId,
            @RequestParam(value = "status", required = false) DocumentStatus status,
            @RequestParam(value = "document_type", required = false) String documentType,
            @RequestParam(value = "page", defaultValue = "1") int page,
            Model model) {

        int size = 5; 
        Page<Document> documentPage = documentAdminService.getDocuments(keyword, categoryId, status, documentType, page, size);
        List<Category> categories = categoryService.getAllCategoriesForAdmin(); 
        Map<String, Object> stats = documentAdminService.getDocumentStats();

        // Get filter stats
        List<Object[]> typeStats = documentAdminService.getDocumentTypeStats(); //
        List<Object[]> categoryStats = documentAdminService.getCategoryStats();// 
        List<Object[]> statusStats = documentAdminService.getStatusStats();

        model.addAttribute("documentPage", documentPage);
        model.addAttribute("categories", categories);
        model.addAttribute("keyword", keyword);
        model.addAttribute("categoryId", categoryId);
        model.addAttribute("status", status);
        model.addAttribute("documentType", documentType);
        model.addAttribute("currentPage", page);
        model.addAttribute("stats", stats);
        model.addAttribute("typeStats", typeStats);
        model.addAttribute("categoryStats", categoryStats);
        model.addAttribute("statusStats", statusStats);

        return "admin/documents";
    }

    @PostMapping("/{id}/approve")
    public String approveDocument(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            documentAdminService.approveDocument(id);
            redirectAttributes.addFlashAttribute("successMessage", "Đã duyệt tài liệu thành công!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
        }
        return "redirect:/admin/documents";
    }

    @PostMapping("/{id}/takedown")
    public String takedownDocument(@PathVariable Long id, 
                                   @RequestParam("reason") String reason,
                                   RedirectAttributes redirectAttributes) {
        try {
            documentAdminService.rejectOrTakedownDocument(id, reason);
            redirectAttributes.addFlashAttribute("warningMessage", "Đã từ chối/gỡ tài liệu kèm lý do: " + reason + " và đã gửi Email thông báo.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi: " + e.getMessage());
        }
        return "redirect:/admin/documents";
    }

    @PostMapping("/{id}/delete")
    public String hardDeleteDocument(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            documentAdminService.hardDeleteDocument(id);
            redirectAttributes.addFlashAttribute("successMessage", "Xóa vĩnh viễn (Hard Delete) thành công. File đã bị gỡ khỏi Cloudinary.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi xóa vật lý: " + e.getMessage());
        }
        return "redirect:/admin/documents";
    }

    @PostMapping("/{id}/restore")
    public String restoreDocument(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            documentAdminService.restoreDocument(id);
            redirectAttributes.addFlashAttribute("successMessage", "Ph?c h?i th�nh c�ng! T�i li?u d� hi?n th? l?i tr�n trang ch?.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "L?i: " + e.getMessage());
        }
        return "redirect:/admin/documents";
    }
}
