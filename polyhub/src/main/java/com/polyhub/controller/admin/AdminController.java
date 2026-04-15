package com.polyhub.controller.admin;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.MentorRequestStatus;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminController {

    private final MentorRequestRepository mentorRequestRepository;
    private final UserService userService;

    // Map cả 2 đường dẫn /admin và /admin/dashboard về chung 1 trang
    @GetMapping({ "", "/", "/dashboard" })
    public String dashboard() {
        return "admin/dashboard"; // Mở file templates/admin/dashboard.html
    }

    @GetMapping("/users/detail")
    public String userDetail() {
        return "admin/user_detail";
    }

    @GetMapping("/mentors")
    public String mentors(Model model) {
        List<MentorRequest> requests = mentorRequestRepository.findAll();

        long pendingCount = requests.stream().filter(r -> r.getStatus() == MentorRequestStatus.PENDING).count();
        long approvedCount = requests.stream().filter(r -> r.getStatus() == MentorRequestStatus.APPROVED).count();
        long rejectedCount = requests.stream().filter(r -> r.getStatus() == MentorRequestStatus.REJECTED).count();

        model.addAttribute("requests", requests);
        model.addAttribute("pendingCount", pendingCount);
        model.addAttribute("approvedCount", approvedCount);
        model.addAttribute("rejectedCount", rejectedCount);

        return "admin/mentors";
    }

    @PostMapping("/mentors/{id}/approve")
    public String approveMentor(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            userService.approveMentor(id.toString());
            redirectAttributes.addFlashAttribute("successMessage", "Đã phê duyệt yêu cầu trở thành Mentor.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi phê duyệt mentor.");
        }
        return "redirect:/admin/mentors";
    }

    @PostMapping("/mentors/{id}/reject")
    public String rejectMentor(@PathVariable Long id, @RequestParam(value = "reason", required = false) String reason,
            RedirectAttributes redirectAttributes) {
        try {
            userService.rejectMentor(id.toString(), reason);
            redirectAttributes.addFlashAttribute("successMessage", "Đã từ chối yêu cầu trở thành Mentor.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi từ chối mentor.");
        }
        return "redirect:/admin/mentors";
    }

    @GetMapping("/mentors/detail")
    public String mentorDetail() {
        return "admin/mentor_detail";
    }

    @GetMapping("/groups")
    public String groups() {
        return "admin/groups";
    }

    @GetMapping("/reports")
    public String reports() {
        return "admin/reports";
    }

}
