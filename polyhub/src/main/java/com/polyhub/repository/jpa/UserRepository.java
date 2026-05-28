package com.polyhub.repository.jpa;

import com.polyhub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Optional<User> findByUsernameOrEmail(String username, String email);

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    long countByRole_Id(String roleId);

    // Từ nhánh tien
    List<User> findByMajorAndUsernameNotIn(String major, List<String> usernames);

    // Từ nhánh DemoASM1
    Page<User> findByFullnameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullname, String email, Pageable pageable);

    List<User> findByFollowers_Username(String username);
}
