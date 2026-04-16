package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import java.security.Principal;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/settings")
public class SettingsController {

  @Autowired
  private UserRepository userRepository;

  @GetMapping({ "", "/{section}" })
  public String settings(
    @PathVariable(required = false) String section,
    Principal principal,
    Model model
  ) {
    if (principal == null) {
      return "redirect:/login";
    }
    User user = userRepository.findByUsername(principal.getName()).orElse(null);
    model.addAttribute("currentUser", user);

    model.addAttribute(
      "activeSection",
      Optional.ofNullable(section).orElse("account")
    );

    return "client/settings";
  }

  @PostMapping("/mentor")
  public String handleMentorRegistration(
    @RequestParam("mentorMajor") String mentorMajor,
    @RequestParam("mentorReason") String mentorReason,
    @RequestParam(value = "evidenceLink", required = false) String evidenceLink,
    Principal principal,
    RedirectAttributes redirectAttributes
  ) {
    if (principal == null) {
      return "redirect:/login";
    }

    User user = userRepository.findByUsername(principal.getName()).orElse(null);

    if (user != null) {
      user.setWantsToBecomeMentor(true);
      user.setMentorMajor(mentorMajor);
      user.setMentorReason(mentorReason);
      user.setEvidenceLink(evidenceLink);
      user.setRejectionReason(null); // Reset rejection reason on re-application
      userRepository.save(user);
      redirectAttributes.addFlashAttribute(
        "success",
        "Đơn đăng ký mentor của bạn đã được gửi thành công! Vui lòng chờ quản trị viên xét duyệt."
      );
    } else {
      redirectAttributes.addFlashAttribute(
        "error",
        "Không tìm thấy thông tin người dùng. Vui lòng thử lại."
      );
    }

    return "redirect:/settings/mentor";
  }

}
