package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.security.Principal;
import java.util.Date;

@Controller
@RequestMapping("/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public String profile(Principal principal, Model model) {
        if (principal == null) {
            return "redirect:/login";
        }
        
        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user == null) {
            return "redirect:/login";
        }

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
            }
        }
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
}
