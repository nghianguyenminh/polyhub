package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.UserService;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final UserService userService;
    private final UserRepository userRepository;

    @ModelAttribute("currentUser")
    public User currentUser(Principal principal) {
        if (principal != null) {
            return userRepository.findByUsername(principal.getName()).orElse(null);
        }
        return null;
    }

    @GetMapping("/")
<<<<<<< HEAD
    public String home(Model model, Principal principal) {
=======
    public String index(Principal principal, Model model) {
        // Nếu user đã đăng nhập, lấy bài public + bài private của user. Nếu CHƯA đăng nhập, chỉ lấy bài public (truyền "" hoặc null)
        String viewerUsername = (principal != null) ? principal.getName() : "";
        org.springframework.data.domain.Page<com.polyhub.entity.Post> posts = postRepository.findVisiblePostsForFeed(viewerUsername, org.springframework.data.domain.PageRequest.of(0, 10));
        model.addAttribute("recentPosts", posts.getContent());

>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            model.addAttribute("user", user);
        }
        return "client/index";
    }

    @GetMapping("/contact")
    public String contact(Model model, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            model.addAttribute("user", user);
        }
        return "client/contact";
    }

    @GetMapping("/about")
    public String about(Model model, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            model.addAttribute("user", user);
        }
        return "client/about";
    }
}
