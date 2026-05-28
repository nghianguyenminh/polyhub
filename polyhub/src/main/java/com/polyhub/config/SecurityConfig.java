package com.polyhub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter,
                          UserDetailsService userDetailsService,
                          CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    // 1. Khai báo công cụ mã hóa mật khẩu BCrypt
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Security chain cho REST API (/api/**) — Stateless + JWT.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/**")
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Các endpoint auth công khai
                .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/verify-otp", "/api/auth/reset-password").permitAll()
                // API công khai: xem feed, xem bài viết, tài liệu, mentors (không cần đăng nhập)
                .requestMatchers("/api/v2/posts/feed", "/api/v2/posts/user/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/documents").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/documents/download/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/mentors").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/mentors/*").permitAll()
                .requestMatchers("/api/comments/**").permitAll()
                // Admin API
                .requestMatchers("/api/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "USER_ADMIN", "CONTENT_ADMIN")
                // Tất cả API còn lại cần đăng nhập
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Security chain cho trang web truyền thống (Thymeleaf admin, form login) — Session-based.
     */
    @Bean
    @Order(2)
    public SecurityFilterChain webSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Cấp quyền tự do truy cập tài nguyên tĩnh, đăng ký và đăng nhập, và websocket chat
                .requestMatchers("/client/**", "/admin/css/**", "/admin/js/**", "/css/**", "/js/**", "/images/**", "/register", "/login", "/forgot-password", "/verify-otp", "/error", "/ws-chat/**").permitAll()
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