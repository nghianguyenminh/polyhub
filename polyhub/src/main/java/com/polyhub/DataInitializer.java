package com.polyhub;

import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Tạo Role nếu chưa tồn tại
        createRoleIfNotFound("USER", "Người dùng");
        Role adminRole = createRoleIfNotFound("ADMIN", "Quản trị viên");

        // Tạo Admin user nếu chưa tồn tại
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin")); // Nhớ mã hóa mật khẩu
            admin.setFullname("Quản trị viên");
            admin.setEmail("admin@polyhub.com");
            admin.setActive(true);
            admin.setRole(adminRole);
            userRepository.save(admin);
            System.out.println(">>> Đã tạo tài khoản admin mặc định với mật khẩu 'admin'");
        }
    }

    private Role createRoleIfNotFound(String id, String name) {
        Optional<Role> roleOptional = roleRepository.findById(id);
        if (roleOptional.isEmpty()) {
            Role newRole = new Role(id, name);
            System.out.println(">>> Đã tạo vai trò: " + name);
            return roleRepository.save(newRole);
        }
        return roleOptional.get();
    }
}
