package com.polyhub.service.impl;

import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.UserService;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public List<User> getMentors() {
        return userRepository.findByRole_Name("MENTOR");
    }

    @Override
    public List<User> getMentorRequests() {
        return userRepository.findByWantsToBecomeMentor(true);
    }

    @Override
    public void approveMentorRequest(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setWantsToBecomeMentor(false);
        user.setRole(roleRepository.findByName("MENTOR").get());
        userRepository.save(user);
    }

    @Override
    public void rejectMentorRequest(Long id, String rejectionReason) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setWantsToBecomeMentor(false);
        user.setRejectionReason(rejectionReason);
        userRepository.save(user);
    }

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    @Override
    public void save(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(roleRepository.findByName("USER").get());
        user.setCreatedAt(new Date());
        userRepository.save(user);
    }

    @Override
    public void updateAvatar(User user, MultipartFile avatarFile) {
        // TODO: Implement avatar update
    }

    @Override
    public void updateUser(User user) {
        userRepository.save(user);
    }

    @Override
    public void becomeMentor(User user, String mentorMajor, String mentorDescription) {
        user.setWantsToBecomeMentor(true);
        user.setMentorMajor(mentorMajor);
        user.setMentorDescription(mentorDescription);
        userRepository.save(user);
    }

    @Override
    public void addSkill(User user, String skill) {
        // TODO: Implement add skill
    }

    @Override
    public void removeSkill(User user, String skill) {
        // TODO: Implement remove skill
    }

    @Override
    public void changePassword(User user, String oldPassword, String newPassword) {
        if (passwordEncoder.matches(oldPassword, user.getPassword())) {
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
        }
    }

}
