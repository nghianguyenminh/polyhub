package com.polyhub.repository;

import com.polyhub.entity.PostReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    // Kiểm tra xem user này đã report bài viết này chưa (chống spam report)
    boolean existsByPostIdAndReporterUsername(Long postId, String username);
}