package com.polyhub.service.auth;

import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import java.util.Collections;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

  @Autowired
  private UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    // Tìm kiếm User trong DB theo username
    Optional<User> userOptional = userRepository.findByUsername(username);

    // Nếu không tìm thấy, throw exception
    if (userOptional.isEmpty()) {
      throw new UsernameNotFoundException("Không tìm thấy người dùng với username: " + username);
    }

    // Lấy đối tượng User từ Optional
    User user = userOptional.get();

    // Nếu user không có quyền, trả về UserDetails với danh sách quyền trống
    if (user.getRole() == null) {
      // Điều này ngăn chặn NullPointerException nhưng cũng có nghĩa là người dùng sẽ không có quyền hạn.
      // Cân nhắc ghi log cảnh báo ở đây vì đây là một vấn đề về tính toàn vẹn của dữ liệu.
      return new org.springframework.security.core.userdetails.User(
          user.getUsername(),
          user.getPassword(),
          Collections.emptyList());
    }

    // Tạo danh sách quyền (authorities) từ role của User
    // QUAN TRỌNG: Role trong DB cần có tiền tố "ROLE_" để Spring Security nhận diện.
    // Ví dụ: Role trong DB là "ADMIN" -> Authority là "ROLE_ADMIN"
    GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().getId());

    // Trả về đối tượng UserDetails mà Spring Security sử dụng để xác thực
    return new org.springframework.security.core.userdetails.User(
        user.getUsername(),
        user.getPassword(),
        Collections.singleton(authority));
  }
}
