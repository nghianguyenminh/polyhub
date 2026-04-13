package com.polyhub.repository;

import com.polyhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    // Kiểm tra xem email đã tồn tại hay chưa
    boolean existsByEmail(String email);

    // Kiểm tra xem username đã tồn tại hay chưa
    boolean existsByUsername(String username);

    // Tìm kiếm user theo username hoặc email
    java.util.Optional<User> findByUsernameOrEmail(String username, String email);
}