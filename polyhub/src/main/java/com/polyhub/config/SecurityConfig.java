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
                .requestMatchers("/", "/home", "/client/**", "/admin/css/**", "/admin/js/**", "/css/**", "/js/**", "/images/**").permitAll()
                .requestMatchers("/admin/**", "/profile/**").authenticated()
                .anyRequest().permitAll() 
            )
            .formLogin(login -> login
                .loginPage("/login") 
                .defaultSuccessUrl("/admin/dashboard", true) // Thành công thì vào thẳng Admin
                .permitAll()
            )
            .logout(logout -> logout.permitAll())
            .csrf(csrf -> csrf.disable()); // Tạm tắt CSRF để test đăng nhập cho dễ

        return http.build();
    }
}