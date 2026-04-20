package com.polyhub.controller.client;

import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.data.domain.Page;


import java.security.Principal;
import java.util.Optional;

@Controller
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @GetMapping("/profile/{username}")
    public String viewProfile(@PathVariable("username") String username, Principal principal, Model model) {

        Optional<User> userOptional = userRepository.findById(username);
        if (userOptional.isEmpty()) {
            return "redirect:/error"; // Hoặc trang 404
        }

        User userProfile = userOptional.get();
        model.addAttribute("userProfile", userProfile);

        boolean isOwnProfile = false;
        boolean isFollowing = false;

        if (principal != null) {
            String loggedInUsername = principal.getName();
            User currentUser = userRepository.findById(loggedInUsername).orElse(null);
            model.addAttribute("currentUser", currentUser);

            if (loggedInUsername.equals(username)) {
                isOwnProfile = true;
            } else if (currentUser != null) {
                // Kiểm tra xem người dùng hiện tại có đang theo dõi người dùng của trang cá nhân này không
                isFollowing = currentUser.getFollowing().stream()
                                         .anyMatch(u -> u.getUsername().equals(username));
            }
        }

        model.addAttribute("isOwnProfile", isOwnProfile);
        model.addAttribute("isFollowing", isFollowing);

        // Lấy bài viết cho trang cá nhân của người dùng
        Page<Post> postsPage = postRepository.findByUsernameOrderByCreatedAtDesc(username, PageRequest.of(0, 20));
        model.addAttribute("recentPosts", postsPage.getContent());

        return "client/profile";
    }

    // Chuyển hướng /profile đến trang cá nhân của người dùng đã đăng nhập
    @GetMapping("/profile")
    public String viewOwnProfile(Principal principal) {
        if (principal == null) {
            return "redirect:/login";
        }
        return "redirect:/profile/" + principal.getName();
    }
}
