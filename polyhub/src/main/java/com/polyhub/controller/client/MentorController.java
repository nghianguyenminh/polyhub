package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.security.Principal;

@Controller
public class MentorController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/mentor/register")
    public String registerMentor(
            @RequestParam("mentorMajor") String mentorMajor,
            @RequestParam("mentorReason") String mentorReason,
            @RequestParam("evidenceLink") String evidenceLink,
            Principal principal,
            RedirectAttributes redirectAttributes
    ) {
        if (principal == null) {
            return "redirect:/login";
        }

        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user == null) {
            return "redirect:/login";
        }

        user.setMentorMajor(mentorMajor);
        user.setMentorReason(mentorReason);
        user.setEvidenceLink(evidenceLink);
        user.setWantsToBecomeMentor(true);
        user.setRejectionReason(null); // Clear previous rejection reason on re-application

        userRepository.save(user);

        redirectAttributes.addFlashAttribute("success", "Đơn đăng ký mentor của bạn đã được gửi thành công và đang chờ xét duyệt!");
        return "redirect:/settings/mentor";
    }
}
