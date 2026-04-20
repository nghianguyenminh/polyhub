package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
<<<<<<< HEAD
<<<<<<< HEAD
import com.polyhub.service.UserService;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
=======
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
=======
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.security.Principal;
import java.time.LocalDate;
<<<<<<< HEAD
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

@Controller
@RequiredArgsConstructor
@RequestMapping("/settings")
public class SettingsController {

<<<<<<< HEAD
<<<<<<< HEAD
    private final UserService userService;
    private final UserRepository userRepository;

    @ModelAttribute("currentUser")
    public User currentUser(Principal principal) {
        if (principal != null) {
            return userRepository.findByUsername(principal.getName()).orElse(null);
        }
        return null;
    }

    @GetMapping
    public String settings(Model model, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            model.addAttribute("user", user);
        }
        return "client/settings";
    }

    @PostMapping("/change-password")
    public String changePassword(
        @RequestParam("currentPassword") String currentPassword,
        @RequestParam("newPassword") String newPassword,
        Principal principal
    ) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            if (user != null) {
                userService.changePassword(user, currentPassword, newPassword);
            }
        }
        return "redirect:/settings";
    }
=======
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
=======
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
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
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
<<<<<<< HEAD
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
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
                // Kiểm tra Mật khẩu hiện tại trước
                if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                    redirectAttributes.addFlashAttribute("pwdError", "Mật khẩu hiện tại không chính xác!");
                    return "redirect:/settings#security";
                }
                // Sau đó kiểm tra việc xác nhận mật khẩu mới
                if (!newPassword.equals(confirmPassword)) {
                    redirectAttributes.addFlashAttribute("pwdError", "Xác nhận mật khẩu mới không khớp!");
                    return "redirect:/settings#security";
                }
                // Thêm Validate tối thiểu 8 ký tự
                if (newPassword.length() < 8) {
                    redirectAttributes.addFlashAttribute("pwdError", "Mật khẩu mới phải có tối thiểu 8 ký tự!");
                    return "redirect:/settings#security";
                }
                // Cuối cùng là kiểm tra trùng lặp
                if (passwordEncoder.matches(newPassword, user.getPassword())) {
                    redirectAttributes.addFlashAttribute("pwdError", "Mật khẩu mới không được trùng với mật khẩu cũ!");
                    return "redirect:/settings#security";
                }

                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                redirectAttributes.addFlashAttribute("pwdSuccess", "Đổi mật khẩu thành công!");
                return "redirect:/settings#security";
            }
        }
        return "redirect:/settings";
    }
}

