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
    // Kiểm tra số lần user này đã report bài viết này
    @Query("SELECT COUNT(r) FROM PostReport r WHERE r.post.id = :postId AND r.reporter.username = :username AND (r.status != 'REJECTED' OR r.status IS NULL)")
    long countByPostIdAndReporterUsername(@Param("postId") Long postId, @Param("username") String username);

    boolean existsByPostIdAndReporterUsername(Long postId, String username);

    List<PostReport> findByPostId(Long postId);

    @Query("SELECT r FROM PostReport r WHERE r.status IN :statuses OR (r.status IS NULL AND 'PENDING' IN :statuses)")
    Page<PostReport> findByStatusIn(@Param("statuses") List<String> statuses, Pageable pageable);

    @Query("SELECT r FROM PostReport r WHERE r.status IN :statuses OR (r.status IS NULL AND 'PENDING' IN :statuses) " +
            "ORDER BY r.createdAt DESC")
    List<PostReport> findByStatusInUnpaged(@Param("statuses") List<String> statuses);

    @Query("SELECT COUNT(r) FROM PostReport r WHERE r.post.id = :postId AND (r.status != :status OR r.status IS NULL)")
    long countByPostIdAndStatusNot(@Param("postId") Long postId, @Param("status") String status);

    @Query("SELECT COUNT(r) FROM PostReport r WHERE r.post.id = :postId")
    long countByPostId(@Param("postId") Long postId);

    @Query("SELECT COUNT(r) FROM PostReport r WHERE r.status = :status OR (r.status IS NULL AND :status = 'PENDING')")
    long countByStatus(@Param("status") String status);
}
