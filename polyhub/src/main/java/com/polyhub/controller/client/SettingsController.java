package com.polyhub.controller.client;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import java.security.Principal;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/settings")
public class SettingsController {

  @Autowired
  private UserRepository userRepository;

  @GetMapping({ "", "/{section}" })
  public String settings(
    @PathVariable(required = false) String section,
    Principal principal,
    Model model
  ) {
    if (principal == null) {
      return "redirect:/login";
    }
    User user = userRepository.findById(principal.getName()).orElse(null);
    model.addAttribute("currentUser", user);

    // Set the active section, defaulting to "account" if not specified
    model.addAttribute("activeSection", Optional.ofNullable(section).orElse("account"));

    return "client/settings";
  }
}