package com.polyhub.config;

import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Tạo các vai trò nếu chúng chưa tồn tại
        createRoleIfNotFound("SUPER_ADMIN", "ROLE_SUPER_ADMIN");
        createRoleIfNotFound("ADMIN", "ROLE_ADMIN");
        createRoleIfNotFound("USER", "ROLE_USER");

        // Tạo tài khoản Admin nếu nó chưa tồn tại
        if (userRepository.findByUsername("admin").isEmpty()) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new RuntimeException("Error: Admin Role is not found."));

            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setEmail("admin@polyhub.com");
            admin.setFullname("Administrator");
            admin.setRole(adminRole);
            admin.setCreatedAt(new Date());
            admin.setActive(true);

            userRepository.save(admin);
            System.out.println("Created ADMIN account.");
        }
    }

    private void createRoleIfNotFound(String id, String name) {
        if (roleRepository.findByName(name).isEmpty()) {
            roleRepository.save(new Role(id, name));
            System.out.println("Created Role: " + name);
        }
    }
}
