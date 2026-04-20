package com.polyhub.service;

import com.polyhub.dto.request.RegisterRequest;
<<<<<<< HEAD
<<<<<<< HEAD
import com.polyhub.entity.User;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {

    void registerNewUser(RegisterRequest registerRequest);

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
=======
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

public interface UserService {
    /**
     * Xử lý đăng ký tài khoản người dùng mới.
     * @param request dữ liệu được gửi từ form đăng ký
     * @return String: Thông báo kết quả ("success" nếu thành công, hoặc các lỗi cụ thể như "Trùng username")
     */
    String registerUser(RegisterRequest request);
<<<<<<< HEAD
}
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
=======
}
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
