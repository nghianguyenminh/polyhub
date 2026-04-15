package com.polyhub.service;

import com.polyhub.dto.request.RegisterRequest;
import com.polyhub.entity.User;

import java.util.List;
import java.util.Optional;

public interface UserService {
    /**
     * Xử lý đăng ký tài khoản người dùng mới.
     * @param request dữ liệu được gửi từ form đăng ký
     * @return User: The newly created user
     */
    User registerNewUser(RegisterRequest request);

    List<User> getAllUsers();

    void toggleLock(Long id);

    void approveMentor(Long id);

    void rejectMentor(Long id, String reason);

    Optional<User> findById(Long id);

    List<User> findByRole(String role);
}
