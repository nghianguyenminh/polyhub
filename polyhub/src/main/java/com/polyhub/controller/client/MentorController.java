package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
public class MentorController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @GetMapping("/mentors")
    public String mentorPage(Model model) {
        // Find users who have the MENTOR role
        List<User> mentors = userRepository.findByRole_Id("MENTOR");
        model.addAttribute("mentors", mentors);
        return "client/mentors";
    }


    @GetMapping("/mentor-detail")
    public String mentorDetail(@RequestParam("id") Long id, Model model) {
        User mentor = userRepository.findById(id).orElse(null);

        if (mentor == null || !"MENTOR".equals(mentor.getRole().getId())) {
            return "redirect:/mentors"; // Or show an error page
        }
        model.addAttribute("mentor", mentor);
        return "client/mentor_detail";
    }

    @PostMapping("/mentor/register")
    public String handleMentorRegistration(@RequestParam("mentorMajor") String mentorMajor,
                                           @RequestParam("mentorReason") String mentorReason,
                                           @RequestParam(value = "evidenceFile", required = false) MultipartFile evidenceFile,
                                           RedirectAttributes redirectAttributes) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "redirect:/login";
        }

        String username = authentication.getName();
        Optional<User> userOptional = userRepository.findByUsernameOrEmail(username, username);

        if (userOptional.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Không tìm thấy người dùng.");
            return "redirect:/settings";
        }

        User userToUpdate = userOptional.get();

        try {
            // Update text-based info first
            userToUpdate.setMentorMajor(mentorMajor);
            userToUpdate.setMentorReason(mentorReason);
            userToUpdate.setWantsToBecomeMentor(true);
            userToUpdate.setRejectionReason(null); // Clear any previous rejection reason

            // Check if a file was uploaded
            if (evidenceFile != null && !evidenceFile.isEmpty()) {
                // Upload to Cloudinary
                Map uploadResult = cloudinaryService.uploadFile(evidenceFile);
                String evidenceUrl = (String) uploadResult.get("url");
                userToUpdate.setEvidenceLink(evidenceUrl); // Save the Cloudinary URL
            }

            userRepository.save(userToUpdate);

            redirectAttributes.addFlashAttribute("successMessage", "Đơn đăng ký của bạn đã được gửi thành công! Vui lòng chờ quản trị viên xét duyệt.");

        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.");
        }

        return "redirect:/settings";
    }
}
