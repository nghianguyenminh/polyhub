package com.polyhub.service.impl;

import com.polyhub.dto.request.RegisterRequest;
import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public String registerUser(RegisterRequest request) {
        // 1. Kiểm tra xác nhận mật khẩu (password confirmation)
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return "Mật khẩu xác nhận không khớp.";
        }

        // 2. Kiểm tra tên đăng nhập (username) đã tồn tại chưa
        if (userRepository.existsByUsername(request.getUsername())) {
            return "Tên đăng nhập đã tồn tại trong hệ thống.";
        }

        // 3. Kiểm tra email đã được sử dụng chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email này đã được sử dụng.";
        }

        // 4. Lấy vai trò mặc định (Sinh viên). Bạn cần đảm bảo ID tương ứng tồn tại trong DB, ví dụ id là "STUDENT" hay "SINH_VIEN".
        // Ở đây giả định mã Role của Sinh viên là "STUDENT". Nếu khác, hãy đổi ID lại cho khớp với DB của bạn.
        Role defaultRole = roleRepository.findById("STUDENT").orElse(null);
        if (defaultRole == null) {
            // Khởi tạo role mặc định nếu chưa có ở lần đầu (phòng trường hợp DB trống)
            defaultRole = new Role("STUDENT", "Sinh viên");
            roleRepository.save(defaultRole);
        }

        // 5. Khởi tạo đối tượng User mới từ DTO
        User newUser = new User();
        newUser.setUsername(request.getUsername());
        
        // Cực kì quan trọng: Mã hóa mật khẩu trước khi lưu vào DB!
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        
        newUser.setFullname(request.getFullname());
        newUser.setEmail(request.getEmail());
        
        // Các thông tin còn lại đã có giá trị mặc định trong Entity (active=true, avatar="default.png"...)
        newUser.setCreatedAt(java.time.LocalDateTime.now()); 
        
        // 6. Gán quyền Sinh viên cho User
        newUser.setRole(defaultRole);

        // 7. Lưu vào cơ sở dữ liệu
        userRepository.save(newUser);

        return "success"; // Trả về text báo hiệu thành công
    }
}