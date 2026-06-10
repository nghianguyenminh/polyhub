package com.polyhub.service;

import com.polyhub.dto.request.RegisterRequest;

public interface UserService {
    /**
     * Xử lý đăng ký tài khoản người dùng mới.
     * @param request dữ liệu được gửi từ form đăng ký
     * @return String: Thông báo kết quả ("success" nếu thành công, hoặc các lỗi cụ thể như "Trùng username")
     */
    String registerUser(RegisterRequest request);
}