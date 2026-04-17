package com.polyhub.controller.admin;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.UserService;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping({"", "/", "/dashboard"})
    public String dashboard(Model model) {
        List<User> users = userRepository.findAll();

        List<User> pendingMentors = users.stream()
            .filter(u -> Boolean.TRUE.equals(u.getWantsToBecomeMentor())) // Null-safe check
            .filter(u -> u.getRole() != null && "USER".equals(u.getRole().getName()))
            .collect(Collectors.toList());

        long approvedMentorCount = users.stream()
            .filter(u -> u.getRole() != null && "MENTOR".equals(u.getRole().getName()))
            .count();

        long rejectedMentorCount = users.stream()
            .filter(u -> u.getRejectionReason() != null && !u.getRejectionReason().isEmpty())
            .count();

        model.addAttribute("pendingMentorRequests", pendingMentors.size());
        model.addAttribute("approvedMentorRequests", approvedMentorCount);
        model.addAttribute("rejectedMentorRequests", rejectedMentorCount);
        model.addAttribute("totalUsers", userRepository.count());
        model.addAttribute("pendingRequestsList", pendingMentors);

        // Example data for charts
        model.addAttribute("dailyTrafficLabels", List.of("Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"));
        model.addAttribute("dailyTrafficData", List.of(120, 190, 300, 500, 200, 350, 400));

        model.addAttribute("documentsByMajorLabels", List.of("Web Development", "Mobile Development", "Data Science", "DevOps"));
        model.addAttribute("documentsByMajorData", List.of(300, 150, 250, 100));

        return "admin/dashboard";
    }

    @GetMapping("/users/detail")
    public String userDetail() {
        return "admin/user_detail";
    }

    @GetMapping("/mentors")
    public String mentors(Model model) {
        List<User> users = userRepository.findAll();
        
        List<User> pendingMentors = users.stream()
            .filter(u -> Boolean.TRUE.equals(u.getWantsToBecomeMentor())) // Null-safe check
            .filter(u -> u.getRole() != null && "USER".equals(u.getRole().getName()))
            .collect(Collectors.toList());

        List<User> approvedMentors = users.stream()
            .filter(u -> u.getRole() != null && "MENTOR".equals(u.getRole().getName()))
            .collect(Collectors.toList());

        model.addAttribute("requests", pendingMentors);
        model.addAttribute("approvedMentors", approvedMentors);
        model.addAttribute("pendingCount", pendingMentors.size());
        model.addAttribute("approvedCount", approvedMentors.size());
        model.addAttribute("rejectedCount", 0);

        return "admin/mentors";
    }

    @PostMapping("/mentors/{id}/approve")
    public String approveMentor(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            userService.approveMentor(id);
            redirectAttributes.addFlashAttribute("successMessage", "Đã phê duyệt yêu cầu trở thành Mentor.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi phê duyệt mentor: " + e.getMessage());
        }
        return "redirect:/admin/mentors";
    }

    @PostMapping("/mentors/{id}/reject")
    public String rejectMentor(
        @PathVariable Long id,
        @RequestParam(value = "reason", required = false) String reason,
        RedirectAttributes redirectAttributes
    ) {
        try {
            userService.rejectMentor(id, reason);
            redirectAttributes.addFlashAttribute("successMessage", "Đã từ chối yêu cầu trở thành Mentor.");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi từ chối mentor: " + e.getMessage());
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
