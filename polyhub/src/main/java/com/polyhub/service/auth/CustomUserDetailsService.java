package com.polyhub.service.auth;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Tìm user trong database
        User user = userRepository.findById(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản: " + username));

        // 2. Chuyển đổi Entity User của bạn thành UserDetails của Spring Security
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(), // Mật khẩu (đã bị băm) trong DB
                user.getActive(),   // Trạng thái tài khoản
                true, true, true,
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().getId()))
        );
    }
}
