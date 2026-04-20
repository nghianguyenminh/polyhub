package com.polyhub.service.auth;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import java.util.Collections;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
<<<<<<< HEAD
<<<<<<< HEAD
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        User user = userOptional.get();
        return new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            user.getPassword(),
            Collections.singleton(new SimpleGrantedAuthority(user.getRole().getName()))
=======
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
        // 1. Tìm user trong database bằng Username hoặc Email (vì form login cho phép nhập 1 trong 2)
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản: " + username));

        // 2. Chuyển đổi Entity User của bạn thành UserDetails của Spring Security
        // Ép kiểu ID Role sang In hoa để đồng nhất khi so sánh phân quyền
        String roleName = "ROLE_" + user.getRole().getId().toUpperCase();
        
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(), // Mật khẩu (đã bị băm) trong DB
                user.getActive(),   // Trạng thái tài khoản
                true, true, true,
                Collections.singleton(new SimpleGrantedAuthority(roleName))
<<<<<<< HEAD
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
        );
    }
}
