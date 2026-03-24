package com.polyhub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // 1. Cho phép tất cả mọi người truy cập trang chủ và các tài nguyên tĩnh (CSS, JS, Images)
                .requestMatchers("/", "/home", "/client/**", "/static/**", "/css/**", "/js/**", "/images/**").permitAll()
                
                // 2. Những trang liên quan đến Admin hoặc Profile thì bắt buộc phải đăng nhập
                .requestMatchers("/admin/**", "/profile/**").authenticated()
                
                // 3. Các yêu cầu còn lại tạm thời cho phép hết để sếp dễ code giao diện
                .anyRequest().permitAll() 
            )
            .formLogin(login -> login
                // Sau này mình sẽ tạo trang login riêng, tạm thời dùng mặc định của Spring
                .defaultSuccessUrl("/", true)
                .permitAll()
            )
            .logout(logout -> logout.permitAll());

        return http.build();
    }
}