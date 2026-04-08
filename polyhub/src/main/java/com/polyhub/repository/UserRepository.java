package com.polyhub.repository;

import com.polyhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    
    // Kiểm tra xem email đã tồn tại hay chưa
    boolean existsByEmail(String email);
}