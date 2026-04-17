package com.polyhub.service;

import com.polyhub.entity.User;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {

    List<User> getAllUsers();

    List<User> getMentors();

    List<User> getMentorRequests();

    void approveMentorRequest(Long id);

    void rejectMentorRequest(Long id, String rejectionReason);

    User findByUsername(String username);

    void save(User user);

    void updateAvatar(User user, MultipartFile avatarFile);

    void updateUser(User user);

    void becomeMentor(User user, String mentorMajor, String mentorDescription);

    void addSkill(User user, String skill);

    void removeSkill(User user, String skill);

    void changePassword(User user, String oldPassword, String newPassword);
}
