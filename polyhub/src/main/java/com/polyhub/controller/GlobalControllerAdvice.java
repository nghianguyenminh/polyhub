package com.polyhub.controller;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
<<<<<<< HEAD
<<<<<<< HEAD
import java.security.Principal;
import lombok.RequiredArgsConstructor;
=======
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
=======
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
<<<<<<< HEAD
<<<<<<< HEAD
@RequiredArgsConstructor
public class GlobalControllerAdvice {

    private final UserRepository userRepository;

    @ModelAttribute("currentUser")
    public User currentUser(Principal principal) {
        if (principal != null) {
            return userRepository.findByUsername(principal.getName()).orElse(null);
        }
        return null;
    }
}
=======
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
public class GlobalControllerAdvice {

    @Autowired
    private UserRepository userRepository;

    @ModelAttribute("currentUser")
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() 
                && !authentication.getPrincipal().equals("anonymousUser")) {
            String username = authentication.getName(); // Lưu ý đây là username trong UserDetails
            return userRepository.findById(username).orElse(null);
        }
        return null;
    }
<<<<<<< HEAD
}
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
=======
}
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
