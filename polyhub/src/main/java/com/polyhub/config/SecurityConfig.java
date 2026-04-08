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
                .requestMatchers("/", "/home", "/client/**", "/admin/css/**", "/admin/js/**", "/css/**", "/js/**", "/images/**", "/register", "/login").permitAll()
                .requestMatchers("/admin/**").hasAnyRole("ADMIN", "ADMIN_SUPER")
                .requestMatchers("/profile/**", "/saved").authenticated()
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
            .csrf(csrf -> csrf.disable()); // Tạm tắt CSRF để test đăng nhập cho dễ

        return http.build();
    }
}