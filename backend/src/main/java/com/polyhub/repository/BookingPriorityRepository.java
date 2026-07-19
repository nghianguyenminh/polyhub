package com.polyhub.repository;

import com.polyhub.entity.BookingPriority;
import com.polyhub.entity.PriorityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingPriorityRepository extends JpaRepository<BookingPriority, Long> {
    
    List<BookingPriority> findByStudentUsernameAndMentorUsernameAndStatusAndExpiresAtAfter(
            String studentUsername, String mentorUsername, PriorityStatus status, LocalDateTime now
    );

    List<BookingPriority> findByStudentUsernameAndStatusAndExpiresAtAfter(
            String studentUsername, PriorityStatus status, LocalDateTime now
    );
    
    List<BookingPriority> findByMentorUsernameAndStatusAndExpiresAtAfterOrderByPriorityOrderAsc(
            String mentorUsername, PriorityStatus status, LocalDateTime now
    );
}
