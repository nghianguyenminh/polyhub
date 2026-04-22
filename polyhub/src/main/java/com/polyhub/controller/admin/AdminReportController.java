package com.polyhub.controller.admin;

import com.polyhub.entity.Post;
import com.polyhub.entity.PostReport;
import com.polyhub.repository.jpa.PostReportRepository;
import com.polyhub.repository.jpa.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin/reports")
public class AdminReportController {

    private final PostReportRepository postReportRepository;
    private final PostRepository postRepository;

    @GetMapping
    public String reports(@RequestParam(defaultValue = "1") int page, Model model) {
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PostReport> reportPage = postReportRepository.findAll(pageable);
        
        long pendingCount = postReportRepository.count();
        long resolvedCount = 0; // Tạm thời set cứng vì history sẽ bị xoá
        long falseCount = 0;    // Tạm thời set cứng vì history sẽ bị xoá

        model.addAttribute("reports", reportPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", reportPage.getTotalPages());
        
        model.addAttribute("pendingCount", pendingCount);
        model.addAttribute("resolvedCount", resolvedCount);
        model.addAttribute("falseCount", falseCount);

        return "admin/reports";
    }

    // Xử lý report: Chấp nhận báo cáo vi phạm -> Xoá bài viết (Điều này cascade xoá tất cả report của bài đó)
    @PostMapping("/{id}/approve")
    public String approveReport(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        PostReport report = postReportRepository.findById(id).orElse(null);
        if (report != null && report.getPost() != null) {
            Post post = report.getPost();
            postRepository.delete(post); 
            redirectAttributes.addFlashAttribute("successMessage", "Đã xóa bài viết vi phạm thành công.");
        }
        return "redirect:/admin/reports";
    }

    // Xử lý report: Từ chối báo cáo (Báo cáo sai) -> Xoá report này
    @PostMapping("/{id}/reject")
    public String rejectReport(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        if (postReportRepository.existsById(id)) {
            postReportRepository.deleteById(id);
            redirectAttributes.addFlashAttribute("successMessage", "Đã từ chối báo cáo (Xem như báo cáo sai).");
        }
        return "redirect:/admin/reports";
    }
}
