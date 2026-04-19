package com.polyhub.controller.admin;

<<<<<<< HEAD
import com.polyhub.entity.User;
import com.polyhub.service.UserService;
import java.util.List;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
=======
import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.RequestStatus;
import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.repository.DocumentRepository;
import com.polyhub.repository.PostReportRepository;
import com.polyhub.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin")
public class AdminController {

<<<<<<< HEAD
    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        return "admin/dashboard";
    }

    @GetMapping("/mentors")
    public String mentors(Model model) {
        List<User> mentors = userService.getMentors();
        model.addAttribute("mentors", mentors);
        return "admin/mentors";
    }

    @GetMapping("/mentor-requests")
    public String mentorRequests(Model model) {
        List<User> mentorRequests = userService.getMentorRequests();
        model.addAttribute("mentorRequests", mentorRequests);
        return "admin/mentor-requests";
=======
    private final MentorRequestRepository mentorRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;
    private final DocumentRepository documentRepository;
    private final PostReportRepository postReportRepository;

    // Map cả 2 đường dẫn /admin và /admin/dashboard về chung 1 trang
    @GetMapping({"", "/", "/dashboard"})
    public String dashboard(Model model) {
        long totalUsers = userRepository.count();
        long totalDocuments = documentRepository.count();
        long pendingMentors = mentorRequestRepository.countByStatus(RequestStatus.PENDING);
        long totalReports = postReportRepository.count();

        List<Object[]> countByCategory = documentRepository.countByCategory();

        model.addAttribute("totalUsers", totalUsers);
        model.addAttribute("totalDocuments", totalDocuments);
        model.addAttribute("pendingMentors", pendingMentors);
        model.addAttribute("totalReports", totalReports);
        model.addAttribute("countByCategory", countByCategory);

        return "admin/dashboard"; // Mở file templates/admin/dashboard.html
    }

    @GetMapping("/mentors")
    public String mentors(@RequestParam(defaultValue = "1") int page,
                          @RequestParam(required = false, defaultValue="ALL") String status,
                          Model model) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page - 1, 5, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        org.springframework.data.domain.Page<MentorRequest> reqPage;

        if ("ALL".equalsIgnoreCase(status)) {
            reqPage = mentorRequestRepository.findAll(pageable);
        } else {
            RequestStatus reqStatus = RequestStatus.valueOf(status.toUpperCase());
            reqPage = mentorRequestRepository.findByStatus(reqStatus, pageable);
        }
        
        long pendingCount = mentorRequestRepository.countByStatus(RequestStatus.PENDING);
        long approvedCount = mentorRequestRepository.countByStatus(RequestStatus.APPROVED);
        long rejectedCount = mentorRequestRepository.countByStatus(RequestStatus.REJECTED);
        
        model.addAttribute("requests", reqPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", reqPage.getTotalPages());
        model.addAttribute("currentStatus", status);
        model.addAttribute("pendingCount", pendingCount);
        model.addAttribute("approvedCount", approvedCount);
        model.addAttribute("rejectedCount", rejectedCount);
        
        return "admin/mentors"; 
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'USER_ADMIN')")
    @PostMapping("/mentors/{id}/approve")
    public String approveMentor(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && request.getStatus() == RequestStatus.PENDING) {
            request.setStatus(RequestStatus.APPROVED);
            mentorRequestRepository.save(request);

            User user = request.getUser();
            if (user != null) {
                Role role = roleRepository.findById("MENTOR").orElse(null);
                if (role == null) {
                    role = new Role("MENTOR", "Giảng viên / Mentor");
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

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'USER_ADMIN')")
    @PostMapping("/mentors/{id}/reject")
    public String rejectMentor(@PathVariable Long id, @RequestParam(value="reason", required=false) String reason, RedirectAttributes redirectAttributes) {
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && request.getStatus() == RequestStatus.PENDING) {
            request.setStatus(RequestStatus.REJECTED);
            request.setRejectionReason(reason);
            mentorRequestRepository.save(request);

            // Gửi email từ chối có reason
            emailService.sendMentorRejectionEmail(request.getEmail(), request.getFullname(), reason);

            redirectAttributes.addFlashAttribute("successMessage", "Đã từ chối yêu cầu trở thành Mentor.");
        }
        return "redirect:/admin/mentors";
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'USER_ADMIN')")
    @PostMapping("/mentors/{id}/revoke")
    public String revokeMentor(@PathVariable Long id, @RequestParam(value="reason", required=true) String reason, RedirectAttributes redirectAttributes) {
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && request.getStatus() == RequestStatus.APPROVED) {
            request.setStatus(RequestStatus.REVOKED);
            request.setRejectionReason(reason);
            mentorRequestRepository.save(request);

            User user = request.getUser();
            if (user != null) {
                Role role = roleRepository.findById("USER").orElse(null);
                if (role != null) {
                    user.setRole(role);
                    userRepository.save(user); // Cập nhật role về Sinh viên
                }
            }

            // Gửi email báo tước quyền
            emailService.sendMentorRevokeEmail(request.getEmail(), request.getFullname(), reason);

            redirectAttributes.addFlashAttribute("successMessage", "Đã tước quyền Mentor và đưa tài khoản về vai trò Sinh viên.");
        }
        return "redirect:/admin/mentors";
    }

    @GetMapping("/mentors/detail")
    public String mentorDetail() {
        return "admin/mentor_detail"; 
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
    }

    @PostMapping("/approve-mentor/{id}")
    public String approveMentor(@PathVariable Long id) {
        userService.approveMentorRequest(id);
        return "redirect:/admin/mentor-requests";
    }
<<<<<<< HEAD

    @PostMapping("/reject-mentor/{id}")
    public String rejectMentor(@PathVariable Long id, @RequestParam String rejectionReason) {
        userService.rejectMentorRequest(id, rejectionReason);
        return "redirect:/admin/mentor-requests";
    }
}
=======
}
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
