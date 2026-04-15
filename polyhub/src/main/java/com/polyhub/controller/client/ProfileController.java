package com.polyhub.controller.client;

import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.FileStorageService;
import java.io.IOException;
import java.security.Principal;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/profile")
public class ProfileController {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private FileStorageService fileStorageService;

  @Autowired
  private PostRepository postRepository;

  @GetMapping
  public String profile(Principal principal, Model model) {
    if (principal == null) {
      return "redirect:/login";
    }

    User user = userRepository.findByUsername(principal.getName()).orElse(null);
    if (user == null) {
      return "redirect:/login";
    }

    Page<Post> posts = postRepository.findByUser_UsernameOrderByCreatedAtDesc(
      principal.getName(),
      PageRequest.of(0, 10)
    );
    model.addAttribute("recentPosts", posts.getContent());

    model.addAttribute("currentUser", user);
    return "client/profile";
  }

  @PostMapping("/update-info")
  public String updateInfo(
    Principal principal,
    @RequestParam("fullname") String fullname,
    @RequestParam("email") String email,
    @RequestParam("phone") String phone,
    @RequestParam("birthday") @org.springframework.format.annotation.DateTimeFormat(
      pattern = "yyyy-MM-dd"
    ) java.time.LocalDate birthday,
    @RequestParam("gender") Boolean gender,
    RedirectAttributes redirectAttributes
  ) {
    if (principal != null) {
      User user = userRepository.findByUsername(principal.getName()).orElse(null);
      if (user != null) {
        user.setFullname(fullname);
        user.setEmail(email);
        user.setPhone(phone);
        user.setBirthday(birthday);
        user.setGender(gender);
        userRepository.save(user);
        redirectAttributes.addFlashAttribute(
          "success",
          "Thông tin đã được cập nhật."
        );
      }
    }
    return "redirect:/profile#settings";
  }

  @PostMapping("/change-password")
  public String changePassword(
    Principal principal,
    @RequestParam("currentPassword") String currentPassword,
    @RequestParam("newPassword") String newPassword,
    @RequestParam("confirmPassword") String confirmPassword,
    RedirectAttributes redirectAttributes
  ) {
    if (principal != null) {
      User user = userRepository.findByUsername(principal.getName()).orElse(null);
      if (user != null) {
        if (passwordEncoder.matches(currentPassword, user.getPassword())) {
          if (newPassword.equals(confirmPassword)) {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            redirectAttributes.addFlashAttribute(
              "success",
              "Mật khẩu đã được thay đổi."
            );
          } else {
            redirectAttributes.addFlashAttribute(
              "error",
              "Mật khẩu mới không khớp."
            );
          }
        } else {
          redirectAttributes.addFlashAttribute(
            "error",
            "Mật khẩu hiện tại không đúng."
          );
        }
      }
    }
    return "redirect:/profile#settings";
  }

  @PostMapping("/update-avatar")
  public String updateAvatar(
    Principal principal,
    @RequestParam("avatarFile") MultipartFile file,
    RedirectAttributes redirectAttributes
  ) {
    if (principal != null && !file.isEmpty()) {
      User user = userRepository.findByUsername(principal.getName()).orElse(null);
      if (user != null) {
        try {
          Map<String, Object> uploadResult = fileStorageService.uploadImage(
            file,
            "polyhub_avatars"
          );
          String imageUrl = (String) uploadResult.get("url");
          user.setAvatar(imageUrl);
          userRepository.save(user);
          redirectAttributes.addFlashAttribute(
            "success",
            "Ảnh đại diện đã được cập nhật."
          );
        } catch (IOException e) {
          e.printStackTrace();
          redirectAttributes.addFlashAttribute(
            "error",
            "Lỗi khi tải lên ảnh đại diện."
          );
        }
      }
    } else if (file.isEmpty()) {
      redirectAttributes.addFlashAttribute("error", "Vui lòng chọn một tệp.");
    }
    return "redirect:/profile";
  }

  @PostMapping("/update-cover")
  public String updateCover(
    Principal principal,
    @RequestParam("coverFile") MultipartFile file,
    RedirectAttributes redirectAttributes
  ) {
    if (principal != null && !file.isEmpty()) {
      User user = userRepository.findByUsername(principal.getName()).orElse(null);
      if (user != null) {
        try {
          Map<String, Object> uploadResult = fileStorageService.uploadImage(
            file,
            "polyhub_covers"
          );
          String imageUrl = (String) uploadResult.get("url");
          user.setCoverImage(imageUrl);
          userRepository.save(user);
          redirectAttributes.addFlashAttribute(
            "success",
            "Ảnh bìa đã được cập nhật."
          );
        } catch (IOException e) {
          e.printStackTrace();
          redirectAttributes.addFlashAttribute(
            "error",
            "Lỗi khi tải lên ảnh bìa."
          );
        }
      }
    } else if (file.isEmpty()) {
      redirectAttributes.addFlashAttribute("error", "Vui lòng chọn một tệp.");
    }
    return "redirect:/profile";
  }
}
