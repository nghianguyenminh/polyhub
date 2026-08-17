package com.polyhub.repository;

import com.polyhub.entity.Review;
import com.polyhub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // Tìm các review của 1 mentor
    Page<Review> findByMentorOrderByCreatedAtDesc(User mentor, Pageable pageable);

    // Tính điểm trung bình của 1 mentor
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.mentor = :mentor")
    Double getAverageRatingForMentor(@Param("mentor") User mentor);

    // Đếm số lượng đánh giá của 1 mentor
    @Query("SELECT COUNT(r) FROM Review r WHERE r.mentor = :mentor")
    Long countReviewsForMentor(@Param("mentor") User mentor);

    // Kiểm tra xem 1 booking đã được review chưa
    boolean existsByBookingId(Long bookingId);

    // Lấy review theo bookingId
    Optional<Review> findByBookingId(Long bookingId);
}
