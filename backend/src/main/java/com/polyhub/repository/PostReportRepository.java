package com.polyhub.repository;

import com.polyhub.entity.PostReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    // Kiểm tra xem user này đã report bài viết này chưa (chống spam report)
    boolean existsByPostIdAndReporterUsername(Long postId, String username);

    List<PostReport> findByPostId(Long postId);

    @Query("SELECT r FROM PostReport r WHERE r.status IN :statuses OR (r.status IS NULL AND 'PENDING' IN :statuses)")
    Page<PostReport> findByStatusIn(@Param("statuses") List<String> statuses, Pageable pageable);

    @Query("SELECT COUNT(r) FROM PostReport r WHERE r.status = :status OR (r.status IS NULL AND :status = 'PENDING')")
    long countByStatus(@Param("status") String status);
}
