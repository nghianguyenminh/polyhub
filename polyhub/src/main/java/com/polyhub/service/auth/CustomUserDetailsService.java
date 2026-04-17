package com.polyhub.service.auth;

import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản: " + username));

        Role role = user.getRole();
        Collection<? extends GrantedAuthority> authorities;

        if (role == null) {
            // If user has no role, return with no authorities.
            // This prevents the NullPointerException and treats the user as having no permissions.
            authorities = Collections.emptyList();
        } else {
            // If user has a role, create the authority as before.
            String roleName = "ROLE_" + role.getId().toUpperCase();
            authorities = Collections.singleton(new SimpleGrantedAuthority(roleName));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.getActive(),
                true, true, true,
                authorities
        );
    }
}
