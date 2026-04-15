package com.polyhub.controller.admin;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.MentorRequestStatus;
import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.EmailService;
import com.polyhub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminController {

    private final MentorRequestRepository mentorRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;
    private final UserService userService;

    // Map cả 2 đường dẫn /admin và /admin/dashboard về chung 1 trang
    @GetMapping({"", "/", "/dashboard"})
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
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && request.getStatus() == MentorRequestStatus.PENDING) {
            request.setStatus(MentorRequestStatus.APPROVED);
            mentorRequestRepository.save(request);

            User user = request.getUser();
            if (user != null) {
                Role role = roleRepository.findById(2L).orElse(null);
                if (role == null) {
                    role = new Role(2L, "Mentor");
                    roleRepository.save(role);
                }
                user.setRole(role);
                userRepository.save(user); // Cập nhật role trong CSDL ngay
            }

            // Gửi email chúc mừng (phê duyệt Mentor)
            emailService.sendMentorApprovalEmail(request.getEmail(), request.getFullname());

            redirectAttributes.addFlashAttribute("successMessage", "Đã phê duyệt yêu cầu trở thành Mentor.");
        }
        return "redirect:/admin/mentors";
    }

    @PostMapping("/mentors/{id}/reject")
    public String rejectMentor(@PathVariable Long id, @RequestParam(value = "reason", required = false) String reason, RedirectAttributes redirectAttributes) {
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && request.getStatus() == MentorRequestStatus.PENDING) {
            request.setStatus(MentorRequestStatus.REJECTED);
            request.setRejectionReason(reason);
            mentorRequestRepository.save(request);

            // Gửi email từ chối có reason
            emailService.sendMentorRejectionEmail(request.getEmail(), request.getFullname(), reason);

            redirectAttributes.addFlashAttribute("successMessage", "Đã từ chối yêu cầu trở thành Mentor.");
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
