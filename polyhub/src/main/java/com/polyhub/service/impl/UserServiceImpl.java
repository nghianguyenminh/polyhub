package com.polyhub.service.impl;

import com.polyhub.dto.request.RegisterRequest;
import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.UserService;
<<<<<<< HEAD
<<<<<<< HEAD
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
    public void registerNewUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setEmail(registerRequest.getEmail());
        user.setFullname(registerRequest.getFullName());

        Role userRole = roleRepository.findByName("ROLE_USER")
            .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        user.setRole(userRole);
        user.setCreatedAt(new Date());
        userRepository.save(user);
    }

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
=======
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;

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
<<<<<<< HEAD
}
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
=======
}
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
