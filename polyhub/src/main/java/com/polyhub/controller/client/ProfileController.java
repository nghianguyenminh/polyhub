package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.Map;

@Controller
@RequestMapping("/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping
    public String profile() {
        // Dữ liệu người dùng hiện tại đã được inject thông qua GlobalControllerAdvice (biến currentUser)
        return "client/profile";
    }

    /**
     * Chức năng thay đổi Avatar
     */
    @PostMapping("/update-avatar")
    public String updateAvatar(@RequestParam("avatarFile") MultipartFile file, 
                               Authentication authentication, 
                               RedirectAttributes redirectAttributes) {
        if (file.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "Vui lòng chọn ảnh đại diện.");
            return "redirect:/profile";
        }
        
        try {
            // Xác thực người dùng hiện tại
            String username = authentication.getName();
            User user = userRepository.findById(username).orElse(null);
            
            if (user != null) {
                // Upload ảnh lên Cloudinary
                Map<String, Object> uploadResult = fileStorageService.uploadImage(file, "polyhub_avatars");
                String avatarUrl = uploadResult.get("url").toString();
                
                // Cập nhật Database
                user.setAvatar(avatarUrl);
                userRepository.save(user);
                
                redirectAttributes.addFlashAttribute("success", "Cập nhật ảnh đại diện thành công!");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Lỗi khi tải ảnh lên: " + e.getMessage());
        }
        
        return "redirect:/profile";
    }

    /**
     * Chức năng thay đổi Ảnh bìa (Cover Image)
     */
    @PostMapping("/update-cover")
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
                // Upload ảnh lên Cloudinary
                Map<String, Object> uploadResult = fileStorageService.uploadImage(file, "polyhub_covers");
                String coverUrl = uploadResult.get("url").toString();
                
                // Cập nhật Database
                user.setCoverImage(coverUrl);
                userRepository.save(user);
                
                redirectAttributes.addFlashAttribute("success", "Cập nhật ảnh bìa thành công!");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Lỗi khi tải ảnh lên: " + e.getMessage());
        }
        
        return "redirect:/profile";
    }
}
