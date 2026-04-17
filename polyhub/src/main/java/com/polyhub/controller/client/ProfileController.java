package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequiredArgsConstructor
@RequestMapping("/profile")
public class ProfileController {

    private final UserService userService;

    @GetMapping
    public String profile(Model model, @AuthenticationPrincipal User user) {
        model.addAttribute("user", user);
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
}
