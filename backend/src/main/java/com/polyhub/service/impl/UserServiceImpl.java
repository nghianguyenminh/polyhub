package com.polyhub.service.impl;

import com.polyhub.dto.request.RegisterRequest;
import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.UserService;
import com.polyhub.dto.GoogleLoginRequest;
import com.polyhub.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.polyhub.config.JwtService jwtService;

    @Autowired
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @Override
    public String registerUser(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return "Mật khẩu xác nhận không khớp.";
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            return "Tên đăng nhập đã tồn tại trong hệ thống.";
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email này đã được sử dụng.";
        }

        Role defaultRole = roleRepository.findById("STUDENT").orElse(null);
        if (defaultRole == null) {
            defaultRole = new Role("STUDENT", "Sinh viên");
            roleRepository.save(defaultRole);
        }

        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setFullname(request.getFullname());
        newUser.setEmail(request.getEmail());
        newUser.setCreatedAt(java.time.LocalDateTime.now());
        newUser.setRole(defaultRole);

        userRepository.save(newUser);

        return "success";
    }

    @Override
public String processGoogleLogin(GoogleLoginRequest request) {
    Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());
    User user;

    if (optionalUser.isPresent()) {
        user = optionalUser.get();
    } else {
        user = new User();
        user.setUsername(request.getEmail());
        user.setEmail(request.getEmail());
        user.setFullname(request.getName());
        user.setAvatar(request.getAvatarUrl());
        
        Role defaultRole = roleRepository.findById("STUDENT").orElse(null);
        if (defaultRole != null) {
            user.setRole(defaultRole);
        }
        
        userRepository.save(user);
    }

    org.springframework.security.core.userdetails.UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
    return jwtService.generateToken(userDetails);
}
}