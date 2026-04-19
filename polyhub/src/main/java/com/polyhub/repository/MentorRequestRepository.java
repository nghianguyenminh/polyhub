package com.polyhub.repository;

import com.polyhub.entity.MentorRequest;
<<<<<<< HEAD
import com.polyhub.entity.MentorRequestStatus;
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
import com.polyhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

<<<<<<< HEAD
import java.util.List;
=======
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
import java.util.Optional;

@Repository
public interface MentorRequestRepository extends JpaRepository<MentorRequest, Long> {
<<<<<<< HEAD

    List<MentorRequest> findByStatus(MentorRequestStatus status);

    Optional<MentorRequest> findByUser(User user);

    boolean existsByUserAndStatusNot(User user, MentorRequestStatus status);

=======
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
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
}
