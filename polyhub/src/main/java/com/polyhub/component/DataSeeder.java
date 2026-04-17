package com.polyhub.component;

import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create roles
        if (roleRepository.findByName("USER").isEmpty()) {
            roleRepository.save(new Role("USER", "User"));
        }
        if (roleRepository.findByName("ADMIN").isEmpty()) {
            roleRepository.save(new Role("ADMIN", "Admin"));
        }

        // Create admin user
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin"));
            admin.setEmail("admin@polyhub.com");
            admin.setFullname("Admin");
            admin.setRole(roleRepository.findByName("ADMIN").get());
            admin.setGender(true);
            admin.setBirthday(LocalDate.now());
            admin.setActive(true);
            userRepository.save(admin);
        }
    }
}
