package com.polyhub.controller.client;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.MentorRequestStatus;
import com.polyhub.entity.User;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.FileStorageService;
import java.io.IOException;
import java.security.Principal;
import java.util.Date;
import java.util.List;
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
    List<MentorRequest> mentors = mentorRequestRepository.findByStatus(MentorRequestStatus.APPROVED);
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

    MentorRequest mentorRequest = mentorRequestRepository.findByUser(user);
    if (mentorRequest == null) {
      mentorRequest = new MentorRequest();
      mentorRequest.setUser(user);
      mentorRequest.setStatus(MentorRequestStatus.PENDING);
      mentorRequestRepository.save(mentorRequest);
    }

    model.addAttribute("mentorRequest", mentorRequest);
    return "client/mentor_register";
  }

  @PostMapping("/mentor/register")
  public String mentorRegister(
      Model model,
      Principal principal,
      @RequestParam("specialized") String specialized,
      @RequestParam("description") String description,
      @RequestParam("facebookLink") String facebookLink,
      @RequestParam("zaloLink") String zaloLink,
      @RequestParam("githubLink") String githubLink,
      @RequestParam("cv") MultipartFile cv,
      @RequestParam("certificate1") MultipartFile certificate1,
      @RequestParam("certificate2") MultipartFile certificate2)
      throws IOException {
    User user = userRepository.findByUsername(principal.getName()).orElse(null);
    if (user != null) {
      MentorRequest mentorRequest = mentorRequestRepository.findByUser(user);
      if (mentorRequest == null) {
        mentorRequest = new MentorRequest();
        mentorRequest.setUser(user);
      }
      mentorRequest.setSpecialized(specialized);
      mentorRequest.setDescription(description);
      mentorRequest.setFacebookLink(facebookLink);
      mentorRequest.setZaloLink(zaloLink);
      mentorRequest.setGithubLink(githubLink);
      mentorRequest.setStatus(MentorRequestStatus.PENDING);
      mentorRequest.setCreateAt(new Date());

      if (!cv.isEmpty()) {
        String cvUrl = fileStorageService.uploadFile(cv);
        mentorRequest.setCv(cvUrl);
      }

      if (!certificate1.isEmpty()) {
        String certificate1Url = fileStorageService.uploadFile(certificate1);
        mentorRequest.setCertificate1(certificate1Url);
      }
      if (!certificate2.isEmpty()) {
        String certificate2Url = fileStorageService.uploadFile(certificate2);
        mentorRequest.setCertificate2(certificate2Url);
      }
      mentorRequestRepository.save(mentorRequest);
    }

    return "redirect:/mentor/register";
  }
}