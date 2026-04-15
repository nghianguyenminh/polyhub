package com.polyhub.repository;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.MentorRequestStatus;
import com.polyhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MentorRequestRepository extends JpaRepository<MentorRequest, Long> {

    List<MentorRequest> findByStatus(MentorRequestStatus status);

    Optional<MentorRequest> findByUser(User user);

    boolean existsByUserAndStatusNot(User user, MentorRequestStatus status);

}
