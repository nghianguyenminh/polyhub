package com.polyhub.repository;

import com.polyhub.entity.DocumentReport;
import com.polyhub.entity.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentReportRepository extends JpaRepository<DocumentReport, Long> {

        boolean existsByDocument_IdAndReporter_Username(Long documentId, String username);

        @Query(value = "SELECT r FROM DocumentReport r " +
                        "LEFT JOIN FETCH r.document d " +
                        "LEFT JOIN FETCH r.reporter u " +
                        "WHERE (:status IS NULL OR r.status = :status) " +
                        "AND (:documentId IS NULL OR r.document.id = :documentId) " +
                        "ORDER BY r.createdAt DESC", countQuery = "SELECT COUNT(r) FROM DocumentReport r " +
                                        "WHERE (:status IS NULL OR r.status = :status) " +
                                        "AND (:documentId IS NULL OR r.document.id = :documentId)")
        Page<DocumentReport> searchReports(@Param("status") ReportStatus status,
                        @Param("documentId") Long documentId,
                        Pageable pageable);

        // Đếm report PENDING theo trạng thái - hiển thị badge số lượng chờ xử lý trên
        // trang admin
        long countByStatus(ReportStatus status);

        // Nhóm số report PENDING theo tài liệu - giúp admin ưu tiên xử lý tài liệu bị
        // report nhiều nhất
        @Query("SELECT r.document.id, COUNT(r) FROM DocumentReport r " +
                        "WHERE r.status = 'PENDING' GROUP BY r.document.id ORDER BY COUNT(r) DESC")
        List<Object[]> countPendingGroupedByDocument();

        //
        @Query("SELECT r FROM DocumentReport r " +
                        "LEFT JOIN FETCH r.document d " +
                        "LEFT JOIN FETCH r.reporter u " +
                        "WHERE r.status IN :statuses " +
                        "ORDER BY r.createdAt DESC")
        List<DocumentReport> findByStatusInWithDetails(@Param("statuses") List<ReportStatus> statuses);
}
