package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.security.Principal;

@Controller
public class MentorController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @PostMapping("/mentor/register")
    public String becomeMentor(
            Principal principal,
            @RequestParam("mentorMajor") String mentorMajor,
            @RequestParam("mentorReason") String mentorReason,
            @RequestParam("evidenceFile") MultipartFile evidenceFile,
            RedirectAttributes redirectAttributes) {

        if (principal == null) {
            return "redirect:/login";
        }

        String username = principal.getName();
        // FIX: Use findByUsernameOrEmail as defined in the repository
        User user = userRepository.findByUsernameOrEmail(username, username).orElse(null);

        if (user == null) {
            // User not found, which shouldn't happen if they are logged in.
            return "redirect:/login";
        }

        // Check if a file was actually uploaded
        if (evidenceFile.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Vui lòng chọn một tệp để tải lên.");
            return "redirect:/settings";
        }

        try {
            // FIX: Assign the result of uploadFile (a String) directly to the variable
            String evidenceUrl = cloudinaryService.uploadFile(evidenceFile, "mentor_applications");

            // Update user's mentor registration info
            user.setMentorMajor(mentorMajor);
            user.setMentorReason(mentorReason);
            user.setEvidenceLink(evidenceUrl); // Save the Cloudinary URL
            user.setWantsToBecomeMentor(true);
            user.setRejectionReason(null); // Clear any previous rejection reason
            userRepository.save(user);

            redirectAttributes.addFlashAttribute("successMessage", "Đơn đăng ký của bạn đã được gửi thành công! Vui lòng chờ quản trị viên xét duyệt.");

        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("errorMessage", "Lỗi khi tải lên tệp. Vui lòng thử lại.");
        }

        return "redirect:/settings";
    }
}
