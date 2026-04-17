package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.security.Principal;
import java.time.LocalDate;

@Controller
@RequestMapping("/settings")
public class SettingsController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping
    public String settings(Principal principal, Model model) {
        if (principal == null) {
            return "redirect:/login";
        }
        
        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user == null) {
            return "redirect:/login";
        }

        model.addAttribute("currentUser", user);
        return "client/settings";
    }
    @PostMapping("/update-account")
public String updateAccount(Principal principal,
                            @RequestParam("fullname") String fullname,
                            @RequestParam(value = "phone", required = false) String phone,
                            @RequestParam(value = "birthday", required = false) @org.springframework.format.annotation.DateTimeFormat(pattern = "yyyy-MM-dd") java.time.LocalDate birthday,
                            @RequestParam("gender") Boolean gender,
                            @RequestParam(value = "bio", required = false) String bio,
                            RedirectAttributes redirectAttributes) {
    if (principal != null) {
        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user != null) {
            System.out.println("Dang cap nhat cho: " + principal.getName());
            
            user.setFullname(fullname);
            user.setPhone(phone);
            user.setBirthday(birthday);
            user.setGender(gender);
            user.setBio(bio); 
            
            userRepository.save(user);
            redirectAttributes.addFlashAttribute("success", "Cập nhật thành công!");
        }
    }
    return "redirect:/settings";
}
    @PostMapping("/change-password")
public String changePassword(Principal principal,
                             @RequestParam("currentPassword") String currentPassword,
                             @RequestParam("newPassword") String newPassword,
                             @RequestParam("confirmPassword") String confirmPassword, 
                             RedirectAttributes redirectAttributes) {
    if (principal != null) {
        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user != null) {
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                redirectAttributes.addFlashAttribute("pwdError", "Mật khẩu hiện tại không chính xác!");
                return "redirect:/settings#security";
            }
            if (!newPassword.equals(confirmPassword)) {
                redirectAttributes.addFlashAttribute("pwdError", "Xác nhận mật khẩu mới không khớp!");
                return "redirect:/settings#security";
            }
            if (passwordEncoder.matches(newPassword, user.getPassword())) {
                redirectAttributes.addFlashAttribute("pwdError", "Mật khẩu mới không được trùng với mật khẩu cũ!");
                return "redirect:/settings#security";
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            redirectAttributes.addFlashAttribute("pwdSuccess", "Đổi mật khẩu thành công!");
        }
    }
    return "redirect:/settings";
}
}

