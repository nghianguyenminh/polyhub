package com.polyhub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // 1. Khai báo công cụ mã hóa mật khẩu BCrypt
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Cấu hình các tài nguyên công khai, được phép truy cập không cần đăng nhập
                .requestMatchers("/", "/home", "/client/**", "/admin/css/**", "/admin/js/**", "/css/**", "/js/**", "/images/**", "/register", "/login").permitAll()
                
                // Chỉ "Quản trị viên" hoặc "Quản trị viên cấp cao" mới vào được route /admin/**
                .requestMatchers("/admin/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN", "ROLE_ADMIN_SUPER", "ROLE_SUPER_ADMIN", "ROLE_SUPERADMIN", "ROLE_ADMIN_SYSTEM")
                
                // Các chức năng riêng tư yêu cầu đăng nhập đối với Sinh viên, Mentor...
                .requestMatchers("/profile/**", "/saved").hasAnyAuthority("STUDENT", "MENTOR", "ROLE_STUDENT", "ROLE_MENTOR")
                
                // Cho phép mặc định các route còn lại (nên siết lại sau này)
                .anyRequest().permitAll() 
            )
            .formLogin(login -> login
                .loginPage("/login") 
                // Cấu hình chuyển hướng theo Role sau khi đăng nhập thành công
                .successHandler((request, response, authentication) -> {
                    boolean isAdmin = authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || a.getAuthority().equals("ROLE_ADMIN"));
                    if (isAdmin) {
                        response.sendRedirect("/admin/dashboard");
                    } else {
                        response.sendRedirect("/");
                    }
                })
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")
                .permitAll()
            )
            .csrf(csrf -> csrf.disable()); // Tạm tắt CSRF để test dễ dàng

        return http.build();
    }
}