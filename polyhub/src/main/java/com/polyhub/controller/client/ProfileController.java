package com.polyhub.controller.client;

import com.polyhub.entity.User;
<<<<<<< HEAD
=======
import com.polyhub.entity.Post;
>>>>>>> origin/appmod/java-upgrade-20260406032344
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.FileStorageService;
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

import java.io.IOException;
import java.security.Principal;
import java.util.Map;

@Controller
@RequestMapping("/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
<<<<<<< HEAD
    private PostRepository postRepository; // Assuming you have a PostRepository

=======
    private PasswordEncoder passwordEncoder;
    
>>>>>>> origin/appmod/java-upgrade-20260406032344
    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private PostRepository postRepository;

    @GetMapping
<<<<<<< HEAD
    public String profile(Model model, Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findById(username).orElse(null);

        if (user != null) {
            model.addAttribute("user", user);
            // Assuming you want to show the user's own posts on their profile
            model.addAttribute("posts", postRepository.findByUserOrderByCreatedAtDesc(user));
        } else {
            // Handle case where user is not found, perhaps redirect to an error page or login
            return "redirect:/login";
        }

        return "client/profile";
    }

    @PostMapping("/update-avatar")
    public String updateAvatar(@RequestParam("avatarFile") MultipartFile file,
                               Authentication authentication,
                               RedirectAttributes redirectAttributes) {
        if (file.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "Vui lòng chọn ảnh đại diện.");
            return "redirect:/profile";
        }

        try {
            String username = authentication.getName();
            User user = userRepository.findById(username).orElse(null);

            if (user != null) {
                Map<String, Object> uploadResult = fileStorageService.uploadImage(file, "polyhub_avatars");
                String avatarUrl = uploadResult.get("url").toString();
                user.setAvatar(avatarUrl);
                userRepository.save(user);
                redirectAttributes.addFlashAttribute("success", "Cập nhật ảnh đại diện thành công!");
=======
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
        return "client/profile";
    }

    @PostMapping("/update-info")
    public String updateInfo(Principal principal, 
                             @RequestParam("fullname") String fullname,
                             @RequestParam("email") String email,
                             @RequestParam("phone") String phone,
                             @RequestParam("birthday") @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate birthday,
                             @RequestParam("gender") Boolean gender) {
        if (principal != null) {
            User user = userRepository.findById(principal.getName()).orElse(null);
            if (user != null) {
                user.setFullname(fullname);
                user.setEmail(email);
                user.setPhone(phone);
                user.setBirthday(birthday);
                user.setGender(gender);
                userRepository.save(user);
>>>>>>> origin/appmod/java-upgrade-20260406032344
            }
        }
<<<<<<< HEAD

=======
        return "redirect:/profile#settings";
    }

    @PostMapping("/change-password")
    public String changePassword(Principal principal, 
                                 @RequestParam("currentPassword") String currentPassword,
                                 @RequestParam("newPassword") String newPassword,
                                 @RequestParam("confirmPassword") String confirmPassword) {
        if (principal != null) {
            User user = userRepository.findById(principal.getName()).orElse(null);
            if (user != null) {
                if (passwordEncoder.matches(currentPassword, user.getPassword()) && newPassword.equals(confirmPassword)) {
                    user.setPassword(passwordEncoder.encode(newPassword));
                    userRepository.save(user);
                }
            }
        }
        return "redirect:/profile#settings";
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
>>>>>>> origin/appmod/java-upgrade-20260406032344
        return "redirect:/profile";
    }

    @PostMapping("/update-cover")
<<<<<<< HEAD
    public String updateCover(@RequestParam("coverFile") MultipartFile file,
                              Authentication authentication,
                              RedirectAttributes redirectAttributes) {
        if (file.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "Vui lòng chọn ảnh bìa.");
            return "redirect:/profile";
        }

        try {
            String username = authentication.getName();
            User user = userRepository.findById(username).orElse(null);

            if (user != null) {
                Map<String, Object> uploadResult = fileStorageService.uploadImage(file, "polyhub_covers");
                String coverUrl = uploadResult.get("url").toString();
                user.setCoverImage(coverUrl);
                userRepository.save(user);
                redirectAttributes.addFlashAttribute("success", "Cập nhật ảnh bìa thành công!");
=======
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
>>>>>>> origin/appmod/java-upgrade-20260406032344
            }
        }
<<<<<<< HEAD

=======
>>>>>>> origin/appmod/java-upgrade-20260406032344
        return "redirect:/profile";
    }
}
