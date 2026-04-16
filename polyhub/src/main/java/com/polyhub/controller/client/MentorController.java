package com.polyhub.controller.client;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.MentorRequestStatus;
import com.polyhub.entity.User;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.FileStorageService;
import java.io.IOException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@Controller
public class MentorController {

  @Autowired private UserRepository userRepository;

  @Autowired private MentorRequestRepository mentorRequestRepository;

  @Autowired private FileStorageService fileStorageService;

  @GetMapping("/mentors")
  public String mentors(Model model) {
    List<User> mentors = userRepository.findByRole_Name("MENTOR");
    model.addAttribute("mentors", mentors);
    return "client/mentors";
  }

  @GetMapping("/mentor/{id}")
  public String mentorDetail(Model model, @PathVariable("id") Long id) {
    Optional<User> mentorO = userRepository.findById(id);
    if (mentorO.isPresent()) {
      model.addAttribute("mentor", mentorO.get());
    }
    return "client/mentor_detail";
  }

  @GetMapping("/mentor/register")
  public String mentorRegister(Model model, Principal principal) {
    User user = userRepository.findByUsername(principal.getName()).orElse(null);
    model.addAttribute("user", user);

    return "client/mentor_register";
  }

  @PostMapping("/mentor/register")
  public String mentorRegister(
    Model model,
    Principal principal,
    @RequestParam("mentorMajor") String mentorMajor,
    @RequestParam("mentorReason") String mentorReason,
    @RequestParam("evidenceLink") String evidenceLink,
    @RequestParam("cv") MultipartFile cv
  ) throws IOException {
    User user = userRepository.findByUsername(principal.getName()).orElse(null);
    if (user != null) {
      user.setMentorMajor(mentorMajor);
      user.setMentorReason(mentorReason);
      user.setEvidenceLink(evidenceLink);
      user.setWantsToBecomeMentor(true);
      userRepository.save(user);
    }

    return "redirect:/mentor/register";
  }
}
