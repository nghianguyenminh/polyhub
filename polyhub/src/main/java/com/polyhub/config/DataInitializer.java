package com.polyhub.config;

import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner commandLineRunner(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        return args -> {

            // Tạo role nếu chưa có
            Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseGet(() -> {
                Role newRole = new Role();
                newRole.setName("ROLE_ADMIN");
                roleRepository.save(newRole);
                System.out.println("Created Role: ROLE_ADMIN");
                return newRole;
            });

            roleRepository.findByName("ROLE_USER").orElseGet(() -> {
                Role newRole = new Role();
                newRole.setName("ROLE_USER");
                roleRepository.save(newRole);
                System.out.println("Created Role: ROLE_USER");
                return newRole;
            });

            // Xóa tài khoản admin cũ nếu có
            userRepository.findByUsername("admin").ifPresent(userRepository::delete);

            // Tạo tài khoản admin mới với đầy đủ thông tin
            User admin = new User();
            admin.setUsername("admin");
            admin.setFullname("Super Admin");
            admin.setEmail("admin@polyhub.com");
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setRole(adminRole);
            admin.setActive(true); // *** ĐÂY LÀ SỬA LỖI QUAN TRỌNG NHẤT ***
            userRepository.save(admin);
            System.out.println("Created ADMIN account with ACTIVE state.");

        };
    }
}
