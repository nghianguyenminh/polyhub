package com.polyhub.controller.client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ModelAttribute;
import com.polyhub.entity.User;
import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.RequestStatus;
import com.polyhub.repository.UserRepository;
import com.polyhub.repository.MentorRequestRepository;
import lombok.RequiredArgsConstructor;
import java.security.Principal;
@Controller
@RequiredArgsConstructor
public class ConnectionController {
    private final UserRepository userRepository;
    private final MentorRequestRepository mentorRequestRepository;
    @ModelAttribute
    public void addCurrentUser(Principal principal, Model model) {
        if (principal != null) {
            User currentUser = userRepository.findById(principal.getName()).orElse(null);
            model.addAttribute("currentUser", currentUser);
        }
    }
    @GetMapping("/connections")
    public String showConnectionsPage(
            Model model,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "") String keyword) {
        // Fetch Mentors for the right sidebar or mentor tab if needed
        Pageable mentorPageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<MentorRequest> recommendedMentors = mentorRequestRepository.findByStatus(RequestStatus.APPROVED, mentorPageable);
        model.addAttribute("recommendedMentors", recommendedMentors.getContent());
        // Fetch Users with Search
        Pageable userPageable = PageRequest.of(page - 1, 12);
        Page<User> userPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            userPage = userRepository.findByFullnameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    keyword.trim(), keyword.trim(), userPageable);
        } else {
            userPage = userRepository.findAll(userPageable);
        }
        model.addAttribute("users", userPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", userPage.getTotalPages());
        model.addAttribute("keyword", keyword);
        return "client/connections";
    }
    @PostMapping("/connections/follow")
    public String toggleFollow(
            @RequestParam("targetUsername") String targetUsername,
            @RequestParam(value = "redirect", defaultValue = "/connections") String redirectUrl,
            Principal principal) {
        if (principal == null) {
            return "redirect:/login";
        }
        User currentUser = userRepository.findById(principal.getName()).orElse(null);
        User targetUser = userRepository.findById(targetUsername).orElse(null);
        if (currentUser != null && targetUser != null && !currentUser.getUsername().equals(targetUser.getUsername())) {
            // Check if already follows
            if (targetUser.getFollowers().contains(currentUser)) {
                targetUser.getFollowers().remove(currentUser);
                currentUser.getFollowing().remove(targetUser);
            } else {
                targetUser.getFollowers().add(currentUser);
                currentUser.getFollowing().add(targetUser);
            }
            userRepository.save(targetUser);
            userRepository.save(currentUser);
        }
        return "redirect:" + redirectUrl;
    }
}
