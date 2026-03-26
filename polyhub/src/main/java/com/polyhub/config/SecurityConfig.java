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
                .requestMatchers("/", "/home", "/client/**", "/static/**", "/css/**", "/js/**", "/images/**").permitAll()
                .requestMatchers("/admin/**", "/profile/**").authenticated()
                .anyRequest().permitAll() 
            )
            .formLogin(login -> login
                .loginPage("/login") // BÁO CHO SPRING BIẾT TRANG LOGIN CUSTOM
                .defaultSuccessUrl("/", true)
                .permitAll()
            )
            .logout(logout -> logout.permitAll());

        return http.build();
    }
} 