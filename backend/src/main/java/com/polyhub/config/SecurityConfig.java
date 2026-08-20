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
     * Security chain áp dụng cho toàn bộ ứng dụng — Stateless + JWT.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Các endpoint auth công khai
                .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/verify-otp", "/api/auth/reset-password", "/error").permitAll()
                // Cho phép kết nối WebSocket chat
                .requestMatchers("/ws-chat/**").permitAll()
                // API công khai: xem feed, xem bài viết, tài liệu, mentors, categories (không cần đăng nhập)
                .requestMatchers("/api/v2/posts/feed", "/api/v2/posts/user/**").permitAll()
                .requestMatchers("/api/categories", "/api/categories/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/documents").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/documents/download/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/mentors").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/mentors/*").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/verify-otp", "/api/auth/send-2fa-sms").permitAll()
                .requestMatchers("/api/auth/verify-2fa").permitAll()
                .requestMatchers("/api/comments/**").permitAll()
                .requestMatchers("/api/wallet/test-add").permitAll()
                // Các action bài viết (like, share, create...): JWT filter tự xác thực,
                // controller tự kiểm tra Principal — tương tự pattern của /api/comments/**
                .requestMatchers("/api/posts/**").permitAll()
                .requestMatchers("/api/v2/posts/**").permitAll()
                .requestMatchers("/api/saved/**").permitAll()
                // Admin API
                .requestMatchers("/api/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "USER_ADMIN", "CONTENT_ADMIN")
                // Tất cả các request còn lại cần đăng nhập
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(401);
                    response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + authException.getMessage() + "\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json;charset=UTF-8");
                    response.setStatus(403);
                    response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Bạn không có quyền thực hiện chức năng này.\"}");
                })
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
        
    }
}