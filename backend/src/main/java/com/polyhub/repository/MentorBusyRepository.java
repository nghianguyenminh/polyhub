package com.polyhub.repository;

import com.polyhub.entity.MentorBusy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MentorBusyRepository extends JpaRepository<MentorBusy, Long> {
    
    List<MentorBusy> findByMentorUsername(String username);

    @Query("SELECT mb FROM MentorBusy mb WHERE mb.mentor.username = :username AND " +
           "((mb.startTime <= :endTime AND mb.endTime >= :startTime))")
    List<MentorBusy> findOverlappingBusyPeriods(
            @Param("username") String username, 
            @Param("startTime") LocalDateTime startTime, 
            @Param("endTime") LocalDateTime endTime
    );
}
