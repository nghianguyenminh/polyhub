package com.polyhub.controller.client;

import com.polyhub.entity.Category;
import com.polyhub.entity.Document;
import com.polyhub.service.CategoryService;
import com.polyhub.service.client.DocumentClientService;
import java.io.IOException;
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
    Page<Document> documentPage = documentClientService.getDocumentsForClient(
      keyword,
      categoryId,
      page,
      pageSize
    );
    java.util.Set<Long> savedDocIds = new java.util.HashSet<>();
    if (currentUser != null) {
      savedDocIds = documentClientService.getSavedDocumentIds(currentUser);
    }
    model.addAttribute("categories", categories);
    model.addAttribute("documentPage", documentPage);
    model.addAttribute("savedDocIds", savedDocIds);
    model.addAttribute("keyword", keyword);
    model.addAttribute("categoryId", categoryId);
    model.addAttribute("currentPage", page);
    return "client/documents";
  }

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
    }
    return "redirect:/documents";
  }
}
