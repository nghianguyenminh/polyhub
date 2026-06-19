package com.polyhub.repository;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MentorRequestRepository extends JpaRepository<MentorRequest, Long> {
    Optional<MentorRequest> findByUser(User user);
    
    // Fetch all requests with specific status
    java.util.List<MentorRequest> findByStatus(com.polyhub.entity.RequestStatus status);
    
    org.springframework.data.domain.Page<MentorRequest> findByStatus(com.polyhub.entity.RequestStatus status, org.springframework.data.domain.Pageable pageable);
    long countByStatus(com.polyhub.entity.RequestStatus status);
    
    // Check if user already has a pending or approved request
    boolean existsByUserAndStatusNot(User user, com.polyhub.entity.RequestStatus status);
    // Thêm các hàm tìm kiếm theo tên hoặc email hoặc cccd
    @org.springframework.data.jpa.repository.Query("SELECT m FROM MentorRequest m WHERE m.status = :status AND (LOWER(m.fullname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.introduction) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    org.springframework.data.domain.Page<MentorRequest> findByStatusAndKeyword(@org.springframework.data.repository.query.Param("status") com.polyhub.entity.RequestStatus status, @org.springframework.data.repository.query.Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);

    // Loại trừ chính người dùng đang đăng nhập khỏi danh sách mentor (tránh tự nhắn tin/đặt lịch cho chính mình)
    @org.springframework.data.jpa.repository.Query("SELECT m FROM MentorRequest m WHERE m.status = :status AND (:currentUsername IS NULL OR m.user.username <> :currentUsername)")
    org.springframework.data.domain.Page<MentorRequest> findByStatusExcludingUser(@org.springframework.data.repository.query.Param("status") com.polyhub.entity.RequestStatus status, @org.springframework.data.repository.query.Param("currentUsername") String currentUsername, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT m FROM MentorRequest m WHERE m.status = :status AND (:currentUsername IS NULL OR m.user.username <> :currentUsername) AND (LOWER(m.fullname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.introduction) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    org.springframework.data.domain.Page<MentorRequest> findByStatusAndKeywordExcludingUser(@org.springframework.data.repository.query.Param("status") com.polyhub.entity.RequestStatus status, @org.springframework.data.repository.query.Param("keyword") String keyword, @org.springframework.data.repository.query.Param("currentUsername") String currentUsername, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT m FROM MentorRequest m WHERE (LOWER(m.fullname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.introduction) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    org.springframework.data.domain.Page<MentorRequest> searchAllByKeyword(@org.springframework.data.repository.query.Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);
    
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(m) FROM MentorRequest m WHERE m.createdAt >= :start AND m.createdAt < :end")
    long countByCreatedAtBetween(@org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start, @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);
}
