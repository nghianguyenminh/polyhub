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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequiredArgsConstructor
@RequestMapping("/profile")
public class ProfileController {

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
    public String profile(Model model, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            model.addAttribute("user", user);
        }
        return "client/profile";
    }

    @PostMapping("/update-avatar")
    public String updateAvatar(@RequestParam("avatarFile") MultipartFile avatarFile, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            if (user != null) {
                userService.updateAvatar(user, avatarFile);
            }
        }
        return "redirect:/profile";
    }

    @PostMapping("/update-profile")
    public String updateProfile(@ModelAttribute("user") User user, Principal principal) {
        if (principal != null) {
            User currentUser = userRepository.findByUsername(principal.getName()).orElse(null);
            if (currentUser != null) {
                currentUser.setFullname(user.getFullname());
                currentUser.setPhone(user.getPhone());
                currentUser.setAddress(user.getAddress());
                userService.updateUser(currentUser);
            }
        }
        return "redirect:/profile";
    }

    @PostMapping("/become-mentor")
    public String becomeMentor(
        @RequestParam("mentorMajor") String mentorMajor,
        @RequestParam("mentorDescription") String mentorDescription,
        Principal principal
    ) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            if (user != null) {
                userService.becomeMentor(user, mentorMajor, mentorDescription);
            }
        }
        return "redirect:/profile";
    }

    @PostMapping("/add-skill")
    public String addSkill(@RequestParam("skill") String skill, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            if (user != null) {
                userService.addSkill(user, skill);
            }
        }
        return "redirect:/profile";
    }

    @PostMapping("/remove-skill")
    public String removeSkill(@RequestParam("skill") String skill, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            if (user != null) {
                userService.removeSkill(user, skill);
            }
        }
        return "redirect:/profile";
    }
}
