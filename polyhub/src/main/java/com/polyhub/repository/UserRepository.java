
package com.polyhub.repository;
import com.polyhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import com.polyhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

<<<<<<< HEAD
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.username = :username")
    Optional<User> findByUsername(@Param("username") String username);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.username = :usernameOrEmail OR u.email = :usernameOrEmail")
    Optional<User> findByUsernameOrEmail(@Param("usernameOrEmail") String usernameOrEmail);

    // Sửa từ String id thành Integer id
    List<User> findByRoleId(Integer id);

    List<User> findByRole_Name(String roleName);

    List<User> findByWantsToBecomeMentor(boolean wantsToBecomeMentor);

    @Query(value = "SELECT FUNCTION('DATE', u.createdAt), COUNT(u) FROM User u WHERE u.createdAt >= :sevenDaysAgo GROUP BY FUNCTION('DATE', u.createdAt) ORDER BY FUNCTION('DATE', u.createdAt) ASC")
    List<Object[]> countNewUsersPerDay(@Param("sevenDaysAgo") Date sevenDaysAgo);
}
=======
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    Optional<User> findByUsernameOrEmail(String username, String email);

    Optional<User> findByEmail(String email);
    long countByRole_Id(String roleId);
}

    


>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
