package com.polyhub.controller.client;

import com.polyhub.entity.Category;
import com.polyhub.entity.Document;
import com.polyhub.service.CategoryService;
import com.polyhub.service.client.DocumentClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.util.List;

@Controller
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentClientController {

    private final DocumentClientService documentClientService;
    private final CategoryService categoryService; // Lấy danh mục hoạt động

    /**
     * Màn hình danh sách Tài liệu bên Client
     */
    @GetMapping
    public String showDocumentsPage(Model model) {
        // Lấy chuyên ngành CHỈ ĐANG HOẠT ĐỘNG để làm Bộ lọc (Filter) và Selectbox (Upload)
        List<Category> categories = categoryService.getActiveCategoriesForDropdown();
        
        // Lấy danh sách tài liệu mới đăng
        List<Document> documents = documentClientService.getAllDocuments(); 
        
        model.addAttribute("categories", categories);
        model.addAttribute("documents", documents);

        return "client/documents";
    }

    /**
     * Hành động: Nút Chia Sẻ Tài Liệu 
     * Upload File lên hệ thống và gửi thông báo 
     */
    @PostMapping("/upload")
    public String uploadDocument(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam("file") MultipartFile file,
            RedirectAttributes redirectAttributes,
            @ModelAttribute("currentUser") com.polyhub.entity.User currentUser) { // Lấy phiên đăng nhập hiện tại

        try {
            // Kiểm tra file rỗng trước khi load lên
            if (file.isEmpty()) {
                redirectAttributes.addFlashAttribute("error_msg", "Vui lòng chọn 1 file để tải lên!");
                return "redirect:/documents";
            }

            // Xử lý thông qua Service, truyền thêm biến currentUser là uploader
            documentClientService.shareDocument(title, description, categoryId, file, currentUser);

            // Cập nhật thông báo lên Client bằng Flash Attributes
            redirectAttributes.addFlashAttribute("success_msg", "Tải tài liệu thành công! Tài liệu của bạn đã được đưa lên hệ thống.");
            
        } catch (IOException e) {
            redirectAttributes.addFlashAttribute("error_msg", "Đã xảy ra lỗi mạng khi tải file. Thử lại sau nhé!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error_msg", e.getMessage());
        }
        
        return "redirect:/documents"; // Load lại trang Document (cùng form với file HTML bên Client)
    }
}