package com.polyhub.repository;

import com.polyhub.entity.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
// Sửa String thành Integer để khớp với kiểu ID mới của Role
public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByName(String name);
}
