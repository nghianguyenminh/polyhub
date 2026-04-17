package com.polyhub.repository;

import com.polyhub.entity.User;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    List<User> findByRole_Id(Long id);

    @Query(value = "SELECT FUNCTION('DATE', u.createdAt), COUNT(u) FROM User u WHERE u.createdAt >= :sevenDaysAgo GROUP BY FUNCTION('DATE', u.createdAt) ORDER BY FUNCTION('DATE', u.createdAt) ASC")
    List<Object[]> countNewUsersPerDay(@Param("sevenDaysAgo") Date sevenDaysAgo);
}
