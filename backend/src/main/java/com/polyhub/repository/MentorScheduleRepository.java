package com.polyhub.repository;

import com.polyhub.entity.MentorSchedule;
import com.polyhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MentorScheduleRepository extends JpaRepository<MentorSchedule, Long> {
    List<MentorSchedule> findByMentorUsername(String username);
    void deleteByMentor(User mentor);
}
