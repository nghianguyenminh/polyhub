package com.polyhub.repository;

import com.polyhub.entity.VisitorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface VisitorLogRepository extends JpaRepository<VisitorLog, Long> {
    long countByAccessDate(LocalDate accessDate);
    boolean existsByIpAddressAndAccessDate(String ipAddress, LocalDate accessDate);
}
