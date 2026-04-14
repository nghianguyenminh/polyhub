package com.polyhub.repository;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MentorRequestRepository extends JpaRepository<MentorRequest, Long> {
    Optional<MentorRequest> findByUser(User user);
    
    // Check if user already has a pending or approved request
    boolean existsByUserAndStatusNot(User user, com.polyhub.entity.RequestStatus status);
}
