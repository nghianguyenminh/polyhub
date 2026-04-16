package com.polyhub.controller.admin;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.UserService;
import java.util.List;
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

  @GetMapping({"","/", "/dashboard"})
  public String dashboard(Model model) {
    List<User> users = userRepository.findAll();

    List<User> pendingMentors = users
      .stream()
      .filter(User::getWantsToBecomeMentor)
      .filter(u -> u.getRole().getName().equals("USER")) // Chỉ lấy user thường
      .collect(Collectors.toList());

    long approvedMentorCount = users
      .stream()
      .filter(u -> "MENTOR".equals(u.getRole().getName()))
      .count();

    model.addAttribute("pendingMentorRequests", pendingMentors.size());
    model.addAttribute("approvedMentorRequests", approvedMentorCount);
    model.addAttribute("rejectedMentorRequests", 0); // Sẽ cần thêm logic để đếm số mentor bị từ chối
    model.addAttribute("totalUsers", userRepository.count());
    model.addAttribute("pendingRequestsList", pendingMentors);

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
        .filter(u -> u.getWantsToBecomeMentor() && "USER".equals(u.getRole().getName()))
        .collect(Collectors.toList());

    List<User> approvedMentors = users.stream()
        .filter(u -> "MENTOR".equals(u.getRole().getName()))
        .collect(Collectors.toList());

    model.addAttribute("requests", pendingMentors); // Gửi danh sách user muốn làm mentor
    model.addAttribute("approvedMentors", approvedMentors);
    model.addAttribute("pendingCount", pendingMentors.size());
    model.addAttribute("approvedCount", approvedMentors.size());
    model.addAttribute("rejectedCount", 0);

    return "admin/mentors";
  }

  @PostMapping("/mentors/{id}/approve")
  public String approveMentor(
    @PathVariable Long id,
    RedirectAttributes redirectAttributes
  ) {
    try {
      userService.approveMentor(id);
      redirectAttributes.addFlashAttribute(
        "successMessage",
        "Đã phê duyệt yêu cầu trở thành Mentor."
      );
    } catch (Exception e) {
      redirectAttributes.addFlashAttribute(
        "errorMessage",
        "Lỗi khi phê duyệt mentor: " + e.getMessage()
      );
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
      redirectAttributes.addFlashAttribute(
        "successMessage",
        "Đã từ chối yêu cầu trở thành Mentor."
      );
    } catch (Exception e) {
      redirectAttributes.addFlashAttribute(
        "errorMessage",
        "Lỗi khi từ chối mentor: " + e.getMessage()
      );
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
