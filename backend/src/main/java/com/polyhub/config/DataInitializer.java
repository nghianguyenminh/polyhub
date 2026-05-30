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
                newRole.setId("ADMIN");
                newRole.setName("ROLE_ADMIN");
                roleRepository.save(newRole);
                System.out.println("Created Role: ROLE_ADMIN");
                return newRole;
            });

            roleRepository.findByName("ROLE_USER").orElseGet(() -> {
                Role newRole = new Role();
                newRole.setId("USER");
                newRole.setName("ROLE_USER");
                roleRepository.save(newRole);
                System.out.println("Created Role: ROLE_USER");
                return newRole;
            });

            // Kiểm tra và khởi tạo hoặc cập nhật tài khoản admin (Khắc phục lỗi Foreign Key)
            userRepository.findByUsername("admin").ifPresentOrElse(
                existingAdmin -> {
                    // Cập nhật lại các thông tin quan trọng nếu tài khoản đã tồn tại
                    existingAdmin.setActive(true); 
                    existingAdmin.setPassword(passwordEncoder.encode("123456"));
                    existingAdmin.setRole(adminRole);
                    userRepository.save(existingAdmin);
                    System.out.println("Updated existing ADMIN account with ACTIVE state.");
                },
                () -> {
                    // Nếu chưa có thì mới tạo mới hoàn toàn
                    User admin = new User();
                    admin.setUsername("admin");
                    admin.setFullname("Super Admin");
                    admin.setEmail("admin@polyhub.com");
                    admin.setPassword(passwordEncoder.encode("123456"));
                    admin.setRole(adminRole);
                    admin.setActive(true); 
                    userRepository.save(admin);
                    System.out.println("Created new ADMIN account with ACTIVE state.");
                }
            );

        };
    }
}