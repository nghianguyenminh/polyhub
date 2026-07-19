package com.polyhub.repository;

import com.polyhub.entity.AiFeedbackLoop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AiFeedbackLoopRepository extends JpaRepository<AiFeedbackLoop, Long> {
    List<AiFeedbackLoop> findTop5ByOrderByCreatedAtDesc();
}
