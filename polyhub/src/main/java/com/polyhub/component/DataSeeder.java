package com.polyhub.component;

import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // Gọi công cụ mã hóa vào đây

    @Override
    public void run(String... args) throws Exception {
        
        // 1. Tạo quyền Super Admin (Nếu chưa có)
        Role adminRole = roleRepository.findById("SUPER_ADMIN").orElseGet(() -> {
            Role role = new Role();
            role.setId("SUPER_ADMIN");
            role.setName("Quản trị viên cấp cao");
            return roleRepository.save(role);
        });

        // 2. Tạo tài khoản Admin (Nếu chưa có)
        if (!userRepository.existsById("admin")) {
            User admin = new User();
            admin.setUsername("admin"); // Username đăng nhập
            
            // QUAN TRỌNG: Mật khẩu "123456" được băm trước khi lưu
            admin.setPassword(passwordEncoder.encode("123456")); 
            
            admin.setFullname("Hệ thống Admin PolyHUB");
            admin.setEmail("admin@polyhub.com");
            admin.setPhone("0987654321");
            admin.setGender(true);
            admin.setBirthday(LocalDate.now());
            admin.setAvatar("default.png");
            admin.setActive(true);
            admin.setRole(adminRole);

            userRepository.save(admin);
            System.out.println("=======================================================");
            System.out.println(">> Đã khởi tạo tự động tài khoản Super Admin thành công!");
            System.out.println(">> Username: admin");
            System.out.println(">> Password: 123456");
            System.out.println("=======================================================");
        }
    }
}