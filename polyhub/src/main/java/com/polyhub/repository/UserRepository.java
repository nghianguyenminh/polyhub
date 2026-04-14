package com.polyhub.repository;

import com.polyhub.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    // Kiểm tra xem email đã tồn tại hay chưa
    boolean existsByEmail(String email);

    // Kiểm tra xem username đã tồn tại hay chưa
    boolean existsByUsername(String username);

    // Tìm kiếm user theo username hoặc email
    Optional<User> findByUsernameOrEmail(String username, String email);

    List<User> findByRoleId(String roleId);
}
