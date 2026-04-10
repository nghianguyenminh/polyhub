package com.polyhub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomAuthenticationSuccessHandler successHandler;

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
                // Lưu ý: role ID trong DB nếu là "Admin" -> "ROLE_ADMIN". hasAnyAuthority() thường được khuyên dùng để tránh rắc rối tự động thêm tiền tố ROLE_
                .requestMatchers("/admin/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ADMIN_SUPER", "ROLE_SUPER_ADMIN", "ROLE_SUPERADMIN", "ROLE_ADMIN_SYSTEM")
                
                // Các chức năng riêng tư yêu cầu đăng nhập đối với Sinh viên, Mentor...
                .requestMatchers("/profile/**", "/saved").authenticated()
                
                // Cho phép mặc định các route còn lại (nên siết lại sau này)
                .anyRequest().permitAll() 
            )
            .formLogin(login -> login
                .loginPage("/login") 
                .successHandler(successHandler) // Xử lý điều hướng thông minh sau đăng nhập dựa vào Role
                .permitAll()
            )
            .rememberMe(remember -> remember
                .key("polyhubSecretKey") // Khóa bí mật mã hóa cookie
                .tokenValiditySeconds(7 * 24 * 60 * 60) // Thời gian sống của cookie (7 ngày)
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")
                .permitAll()
            )
            // Xử lý ném lỗi 403 mượt mà hơn thay vì hiển thị Whitelabel bằng cách Redirect họ về trang Home
            .exceptionHandling(exception -> exception
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.sendRedirect("/home");
                })
            )
            .csrf(csrf -> csrf.disable()); // Tạm tắt CSRF để test đăng nhập cho dễ

        return http.build();
    }
}