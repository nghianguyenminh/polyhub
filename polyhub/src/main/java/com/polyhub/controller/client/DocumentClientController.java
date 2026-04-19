package com.polyhub.controller.client;

import com.polyhub.entity.Category;
import com.polyhub.entity.Document;
import com.polyhub.service.CategoryService;
import com.polyhub.service.client.DocumentClientService;
import java.io.IOException;
import org.springframework.data.domain.Page;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentClientController {

  private final DocumentClientService documentClientService;
  private final CategoryService categoryService;

<<<<<<< HEAD
  @GetMapping
  public String showDocumentsPage(
    @RequestParam(value = "keyword", required = false) String keyword,
    @RequestParam(value = "category_id", required = false) Long categoryId,
    @RequestParam(value = "page", defaultValue = "1") int page,
    Model model,
    @ModelAttribute("currentUser") com.polyhub.entity.User currentUser
  ) {
    List<Category> categories = categoryService.getActiveCategoriesForDropdown();
    int pageSize = 8;
    // Corrected method call with 4 arguments
    Page<Document> documentPage = documentClientService.getDocumentsForClient(
      keyword,
      categoryId,
      page,
      pageSize
    );
    java.util.Set<Long> savedDocIds = new java.util.HashSet<>();
    if (currentUser != null) {
      savedDocIds = documentClientService.getSavedDocumentIds(currentUser);
=======
    /**
     * Màn hình danh sách Tài liệu bên Client hỗ trợ filter, search, paging
     */
    @GetMapping
    public String showDocumentsPage(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "category_id", required = false) Long categoryId,
            @RequestParam(value = "document_type", required = false) String documentType,
            @RequestParam(value = "page", defaultValue = "1") int page,
            Model model,
            @ModelAttribute("currentUser") com.polyhub.entity.User currentUser) {
        
        // Lấy chuyên ngành CHỈ ĐANG HOẠT ĐỘNG để làm Bộ lọc (Filter) và Selectbox (Upload)
        List<Category> categories = categoryService.getActiveCategoriesForDropdown();
        
        // Lấy danh sách tài liệu mới đăng theo page (8 dòng / trang)
        int pageSize = 8;
        Page<Document> documentPage = documentClientService.getDocumentsForClient(keyword, categoryId, documentType, page, pageSize); 
        
        // Lấy danh sách ID document mà user đã lưu
        java.util.Set<Long> savedDocIds = new java.util.HashSet<>();
        if (currentUser != null) {
            savedDocIds = documentClientService.getSavedDocumentIds(currentUser);
        }

        // Lấy số lượng tài liệu theo category và định dạng file
        java.util.Map<Long, Long> categoryCounts = documentClientService.getApprovedCategoryCounts();
        java.util.Map<String, Long> docTypeCounts = documentClientService.getApprovedDocumentTypeCounts();

        model.addAttribute("categories", categories);
        model.addAttribute("categoryCounts", categoryCounts);
        model.addAttribute("docTypeCounts", docTypeCounts);
        model.addAttribute("documentPage", documentPage); // truyền page object xuống view
        model.addAttribute("savedDocIds", savedDocIds); // truyền danh sách ID đã lưu

        
        // Giữ nguyên các tham số filter để nạp lại vào giao diện (nếu cần đổi màu active hoặc map url param)
        model.addAttribute("keyword", keyword);
        model.addAttribute("categoryId", categoryId);
        model.addAttribute("documentType", documentType);
        model.addAttribute("currentPage", page);

        return "client/documents";
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
    }
    model.addAttribute("categories", categories);
    model.addAttribute("documentPage", documentPage);
    model.addAttribute("savedDocIds", savedDocIds);
    model.addAttribute("keyword", keyword);
    model.addAttribute("categoryId", categoryId);
    model.addAttribute("currentPage", page);
    // Removed calls to non-existent methods
    return "client/documents";
  }

<<<<<<< HEAD
  @PostMapping("/upload")
  public String uploadDocument(
    @RequestParam("title") String title,
    @RequestParam("description") String description,
    @RequestParam("categoryId") Long categoryId,
    @RequestParam("file") MultipartFile file,
    RedirectAttributes redirectAttributes,
    @ModelAttribute("currentUser") com.polyhub.entity.User currentUser
  ) {
    try {
      if (file.isEmpty()) {
        redirectAttributes.addFlashAttribute(
          "error_msg",
          "Vui lòng chọn 1 file để tải lên!"
        );
        return "redirect:/documents";
      }
      documentClientService.shareDocument(
        title,
        description,
        categoryId,
        file,
        currentUser
      );
      redirectAttributes.addFlashAttribute(
        "success_msg",
        "Tải tài liệu thành công! Tài liệu của bạn đã được đưa lên hệ thống."
      );
    } catch (IOException e) {
      redirectAttributes.addFlashAttribute(
        "error_msg",
        "Đã xảy ra lỗi mạng khi tải file. Thử lại sau nhé!"
      );
    } catch (Exception e) {
      redirectAttributes.addFlashAttribute("error_msg", e.getMessage());
=======
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
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
    }
    return "redirect:/documents";
  }
}
