package com.polyhub.controller.client;

import com.polyhub.entity.Category;
import com.polyhub.entity.User;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.CategoryService;
import java.security.Principal;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class HomeController {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private CategoryService categoryService;

  @Autowired
  private PostRepository postRepository;

  @GetMapping("/")
  public String index(Principal principal, Model model) {
    // Tải danh sách bài viết từ database và sắp xếp theo ngày tạo
    Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<com.polyhub.entity.Post> posts = postRepository.findAll(pageable);
    model.addAttribute("recentPosts", posts.getContent());

    if (principal != null) {
      User user = userRepository.findById(principal.getName()).orElse(null);
      if (user != null) {
        model.addAttribute("currentUser", user);

        // Hiển thị popup nếu như user không phải là Admin và chưa cập nhật chuyên ngành
        String roleId = user.getRole() != null ? user.getRole().getId() : "";
        if (!"ADMIN".equals(roleId) && !"SUPER_ADMIN".equals(roleId)) {
          if (user.getMajor() == null || user.getMajor().trim().isEmpty()) {
            model.addAttribute("showMajorPopup", true);
            List<Category> categories = categoryService.getActiveCategoriesForDropdown();
            model.addAttribute("categories", categories);
          }
        }
      }
    }
    return "client/home";
  }

  @PostMapping("/update-major")
  public String updateMajor(
    Principal principal,
    @RequestParam("major") String major
  ) {
    if (principal != null) {
      User user = userRepository.findById(principal.getName()).orElse(null);
      if (user != null) {
        user.setMajor(major);
        userRepository.save(user);
      }
    }
    return "redirect:/";
  }
}