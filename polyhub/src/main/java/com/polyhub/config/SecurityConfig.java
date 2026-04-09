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
                // Cấp quyền tự do truy cập tài nguyên tĩnh và trang public
                .requestMatchers("/", "/home", "/client/**", "/admin/css/**", "/admin/js/**", "/css/**", "/js/**", "/images/**", "/register", "/login").permitAll()
                // Phân quyền cho trang Quản trị: Chỉ những user có role SUPER_ADMIN hoặc ADMIN mới được phép truy cập
                .requestMatchers("/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
                // Các trang cần đăng nhập (User đã đăng nhập được truy cập)
                .requestMatchers("/profile/**", "/documents/upload", "/groups/create", "/update-major").authenticated()
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