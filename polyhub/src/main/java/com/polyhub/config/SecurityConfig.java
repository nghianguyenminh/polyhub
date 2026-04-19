package com.polyhub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomAuthenticationSuccessHandler customAuthenticationSuccessHandler;

    public SecurityConfig(CustomAuthenticationSuccessHandler customAuthenticationSuccessHandler) {
        this.customAuthenticationSuccessHandler = customAuthenticationSuccessHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
<<<<<<< HEAD
                .requestMatchers("/login", "/register", "/public/**", "/client/**", "/css/**", "/js/**", "/images/**", "/perform_login").permitAll()
                .requestMatchers("/admin/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/perform_login")
                .successHandler(customAuthenticationSuccessHandler)
                .failureUrl("/login?error=true") // Thêm dòng này để xử lý lỗi
=======
                // Cấp quyền tự do truy cập tài nguyên tĩnh, đăng ký và đăng nhập
                .requestMatchers("/client/**", "/admin/css/**", "/admin/js/**", "/css/**", "/js/**", "/images/**", "/register", "/login", "/forgot-password", "/verify-otp", "/error").permitAll()
                // Phân quyền cho trang Quản trị: Chỉ những user có role SUPER_ADMIN hoặc ADMIN mới được phép truy cập
                .requestMatchers("/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "USER_ADMIN", "CONTENT_ADMIN")
                // Bắt buộc đăng nhập cho các chức năng và trang chủ (/ và /home)
                .anyRequest().authenticated() 
            )
            .formLogin(login -> login
                .loginPage("/login") 
                // Cấu hình chuyển hướng theo Role sau khi đăng nhập thành công
                .successHandler((request, response, authentication) -> {
                    boolean isAdmin = authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN") || 
                                           a.getAuthority().equals("ROLE_ADMIN") ||
                                           a.getAuthority().equals("ROLE_USER_ADMIN") ||
                                           a.getAuthority().equals("ROLE_CONTENT_ADMIN"));
                    if (isAdmin) {
                        response.sendRedirect("/admin/dashboard");
                    } else {
                        response.sendRedirect("/");
                    }
                })
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
                .permitAll()
            )
            .logout(logout -> logout.permitAll());
        return http.build();
    }
}
