package com.polyhub.repository;

import com.polyhub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("SELECT u FROM User u LEFT JOIN u.role r WHERE u.username != 'admin' AND (r IS NULL OR r.id NOT LIKE '%ADMIN%') AND (LOWER(u.fullname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchUsersExcludingAdmins(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT u FROM User u LEFT JOIN u.role r WHERE u.username != 'admin' AND (r IS NULL OR r.id NOT LIKE '%ADMIN%')")
    Page<User> findAllExcludingAdmins(Pageable pageable);

    List<User> findByFollowers_Username(String username);

    @org.springframework.data.jpa.repository.Query("SELECT MONTH(u.createdAt) as month, COUNT(u) as count FROM User u WHERE YEAR(u.createdAt) = :year GROUP BY MONTH(u.createdAt)")
    List<Object[]> countRegistrationsByMonth(@org.springframework.data.repository.query.Param("year") int year);

    @Query("SELECT u FROM User u WHERE " +
            "(:keyword IS NULL OR :keyword = '' OR LOWER(u.fullname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:roleId IS NULL OR :roleId = '' OR u.role.id = :roleId) " +
            "AND (:active IS NULL OR u.active = :active)")
    Page<User> findByFilters(
            @Param("keyword") String keyword,
            @Param("roleId") String roleId,
            @Param("active") Boolean active,
            Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :start AND u.createdAt < :end")
    long countByCreatedAtBetween(@Param("start") java.time.LocalDateTime start, @Param("end") java.time.LocalDateTime end);
    @Query("SELECT u FROM User u WHERE u.role.id = 'MANAGER'")
List<User> findUserManagers();
}
