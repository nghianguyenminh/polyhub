package com.polyhub.controller.client;

import com.polyhub.entity.User;
<<<<<<< HEAD
import com.polyhub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
=======
import com.polyhub.entity.Post;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
<<<<<<< HEAD
=======

import java.io.IOException;
import java.security.Principal;
import java.util.Map;
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

@Controller
@RequiredArgsConstructor
@RequestMapping("/profile")
public class ProfileController {

<<<<<<< HEAD
    private final UserService userService;

    @GetMapping
    public String profile(Model model, @AuthenticationPrincipal User user) {
        model.addAttribute("user", user);
=======
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
        
        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user == null) {
            return "redirect:/login";
        }

        Page<Post> posts = postRepository.findByUsernameOrderByCreatedAtDesc(principal.getName(), PageRequest.of(0, 10));
        model.addAttribute("recentPosts", posts.getContent());

        model.addAttribute("currentUser", user);
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
        return "client/profile";
    }

    @PostMapping("/update-avatar")
    public String updateAvatar(@AuthenticationPrincipal User user, @RequestParam("avatar") MultipartFile avatarFile) {
        userService.updateAvatar(user, avatarFile);
        return "redirect:/profile";
    }

    @PostMapping("/update-profile")
    public String updateProfile(@AuthenticationPrincipal User user, @RequestParam String fullname, @RequestParam String phone, @RequestParam String address) {
        user.setFullname(fullname);
        user.setPhone(phone);
        user.setAddress(address);
        userService.updateUser(user);
        return "redirect:/profile";
    }

    @PostMapping("/become-mentor")
    public String becomeMentor(@AuthenticationPrincipal User user, @RequestParam String mentorMajor, @RequestParam String mentorDescription) {
        userService.becomeMentor(user, mentorMajor, mentorDescription);
        return "redirect:/profile";
    }

    @PostMapping("/add-skill")
    public String addSkill(@AuthenticationPrincipal User user, @RequestParam String skill) {
        userService.addSkill(user, skill);
        return "redirect:/profile";
    }

    @PostMapping("/remove-skill")
    public String removeSkill(@AuthenticationPrincipal User user, @RequestParam String skill) {
        userService.removeSkill(user, skill);
        return "redirect:/profile";
    }

    @PostMapping("/update-avatar")
    public String updateAvatar(Principal principal, @RequestParam("avatarFile") MultipartFile file) {
        if (principal != null && !file.isEmpty()) {
            User user = userRepository.findById(principal.getName()).orElse(null);
            if (user != null) {
                try {
                    Map<String, Object> uploadResult = fileStorageService.uploadImage(file, "polyhub_avatars");
                    String imageUrl = (String) uploadResult.get("url");
                    user.setAvatar(imageUrl);
                    userRepository.save(user);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return "redirect:/profile";
    }

    @PostMapping("/update-cover")
    public String updateCover(Principal principal, @RequestParam("coverFile") MultipartFile file) {
        if (principal != null && !file.isEmpty()) {
            User user = userRepository.findById(principal.getName()).orElse(null);
            if (user != null) {
                try {
                    Map<String, Object> uploadResult = fileStorageService.uploadImage(file, "polyhub_covers");
                    String imageUrl = (String) uploadResult.get("url");
                    user.setCoverImage(imageUrl);
                    userRepository.save(user);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return "redirect:/profile";
    }
}
