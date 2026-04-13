package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import java.security.Principal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/settings")
public class SettingsController {

  @Autowired
  private UserRepository userRepository;

  @GetMapping
  public String settings(Principal principal, Model model) {
    if (principal != null) {
      User user = userRepository.findById(principal.getName()).orElse(null);
      model.addAttribute("currentUser", user);
    }
    return "client/settings";
  }
}