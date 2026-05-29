package com.polyhub.controller.client;

import com.polyhub.entity.SavedDocument;
import com.polyhub.entity.SavedPost;
import com.polyhub.entity.User;
import com.polyhub.service.client.SavedDocumentService;
import com.polyhub.service.client.SavedPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class SavedController {

    private final SavedDocumentService savedDocumentService;
    private final SavedPostService savedPostService;

    @GetMapping("/saved")
    public String getSaved(
            @RequestParam(value = "type", defaultValue = "documents") String type,
            @RequestParam(value = "page", defaultValue = "1") int page,
            Model model,
            @ModelAttribute("currentUser") User currentUser) {
        
        if (currentUser == null) {
            return "redirect:/login"; // Bắt buộc đăng nhập
        }

        // Lấy danh sách tài liệu mà user hiện tại đã lưu, phân trang (8 dòng trên 1 trang giống document)
        int pageSize = 8;
        Page<SavedDocument> savedDocsPage = null;
        Page<SavedPost> savedPostsPage = null;

        // Xử lý filter "Tài liệu" hay "Bài đăng"
        long totalSavedDocs = savedDocumentService.countSavedDocumentsByUser(currentUser);
        Page<SavedPost> allSavedPosts = savedPostService.getSavedPostsByUser(currentUser, PageRequest.of(0, 99999));
        long totalSavedPosts = allSavedPosts.getTotalElements();
        
        if ("documents".equals(type)) {
            savedDocsPage = savedDocumentService.getSavedDocumentsByUser(currentUser, page, pageSize);
        } else if ("posts".equals(type)) {
            savedPostsPage = savedPostService.getSavedPostsByUser(currentUser, PageRequest.of(page - 1, pageSize));
        }

        // Đẩy xuống view
        model.addAttribute("type", type);
        model.addAttribute("savedDocsPage", savedDocsPage);
        model.addAttribute("savedPostsPage", savedPostsPage);
        model.addAttribute("totalSavedDocs", totalSavedDocs);
        model.addAttribute("totalSavedPosts", totalSavedPosts);
        
        return "client/saved";
    }

    @PostMapping("/saved/togglePost")
    public String toggleSavedPost(
            @RequestParam("postId") Long postId,
            RedirectAttributes redirectAttributes,
            @ModelAttribute("currentUser") User currentUser) {

        if (currentUser == null) {
            redirectAttributes.addFlashAttribute("error_msg", "Vui lòng đăng nhập để lưu bài viết!");
            return "redirect:/login"; // Bắt buộc đăng nhập
        }

        try {
            boolean isSaved = savedPostService.toggleSavePost(currentUser, postId);
            if (isSaved) {
                redirectAttributes.addFlashAttribute("success_msg", "Đã lưu bài viết vào danh sách!");
            } else {
                redirectAttributes.addFlashAttribute("info_msg", "Đã hủy lưu bài viết!");
            }
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error_msg", e.getMessage());
        }

        return "redirect:/"; // Hoặc quay về trang trước bằng header Referer
    }


    /**
     * Dùng Form HTML POST để "Lưu/Bỏ lưu"
     */
    @PostMapping("/saved/toggle")
    public String toggleSavedDocument(
            @RequestParam("documentId") Long documentId,
            @RequestParam(value = "redirectUrl", defaultValue = "/documents") String redirectUrl,
            RedirectAttributes redirectAttributes,
            @ModelAttribute("currentUser") User currentUser) {
        
        if (currentUser == null) {
            redirectAttributes.addFlashAttribute("error_msg", "Vui lòng đăng nhập!");
            return "redirect:/login";
        }

        try {
            boolean isSaved = savedDocumentService.toggleSaveDocument(currentUser, documentId);
            redirectAttributes.addFlashAttribute("success_msg", isSaved ? "Đã lưu tài liệu!" : "Đã bỏ lưu tài liệu!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error_msg", e.getMessage());
        }

        return "redirect:" + redirectUrl;
    }
}
