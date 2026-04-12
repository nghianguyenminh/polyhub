package com.polyhub.repository;

import com.polyhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
import java.util.List;
import java.util.Optional;
=======
import org.springframework.stereotype.Repository;
>>>>>>> origin/appmod/java-upgrade-20260406032344

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    // Kiểm tra xem email đã tồn tại hay chưa
    boolean existsByEmail(String email);
<<<<<<< HEAD
    Optional<User> findByUsernameOrEmail(String username, String email);
    List<User> findByRole_Id(String roleId);
=======

    // Kiểm tra xem username đã tồn tại hay chưa
    boolean existsByUsername(String username);

    // Tìm kiếm user theo username hoặc email
    java.util.Optional<User> findByUsernameOrEmail(String username, String email);
>>>>>>> origin/appmod/java-upgrade-20260406032344
}