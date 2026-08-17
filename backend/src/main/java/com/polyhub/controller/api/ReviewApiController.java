package com.polyhub.controller.api;

import com.polyhub.entity.Booking;
import com.polyhub.entity.BookingStatus;
import com.polyhub.entity.Review;
import com.polyhub.entity.User;
import com.polyhub.repository.BookingRepository;
import com.polyhub.repository.ReviewRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
public class ReviewApiController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    public static class ReviewRequest {
        public Long bookingId;
        public Integer rating;
        public String comment;
    }

    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody ReviewRequest request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        if (request.rating == null || request.rating < 1 || request.rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating phải từ 1 đến 5 sao."));
        }

        User student = userRepository.findById(principal.getName()).orElse(null);
        if (student == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Không tìm thấy người dùng."));
        }

        Booking booking = bookingRepository.findById(request.bookingId).orElse(null);
        if (booking == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking không tồn tại."));
        }

        if (!booking.getStudent().getUsername().equals(student.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bạn không có quyền đánh giá cuộc gọi này."));
        }

        if (booking.getStatus() != BookingStatus.CLOSED && booking.getStatus() != BookingStatus.APPROVED) {
            return ResponseEntity.badRequest().body(Map.of("error", "Chỉ được đánh giá cuộc gọi đã diễn ra."));
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã đánh giá cuộc gọi này rồi."));
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setStudent(student);
        review.setMentor(booking.getMentor());
        review.setRating(request.rating);
        review.setComment(request.comment);
        reviewRepository.save(review);

        return ResponseEntity.ok(Map.of("message", "Đánh giá thành công!", "review", buildReviewMap(review)));
    }

    @GetMapping("/mentor/{username}")
    public ResponseEntity<?> getMentorReviews(
            @PathVariable String username,
            @RequestParam(defaultValue = "1") int page) {

        User mentor = userRepository.findById(username).orElse(null);
        if (mentor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy Mentor."));
        }

        Pageable pageable = PageRequest.of(page - 1, 10);
        Page<Review> reviewPage = reviewRepository.findByMentorOrderByCreatedAtDesc(mentor, pageable);

        List<Map<String, Object>> reviewsList = reviewPage.getContent().stream()
                .map(this::buildReviewMap)
                .collect(Collectors.toList());

        Double averageRating = reviewRepository.getAverageRatingForMentor(mentor);
        Long reviewCount = reviewRepository.countReviewsForMentor(mentor);

        Map<String, Object> response = new HashMap<>();
        response.put("reviews", reviewsList);
        response.put("currentPage", reviewPage.getNumber() + 1);
        response.put("totalPages", reviewPage.getTotalPages());
        response.put("totalElements", reviewPage.getTotalElements());
        response.put("averageRating", averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0);
        response.put("reviewCount", reviewCount != null ? reviewCount : 0);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getReviewByBookingId(@PathVariable Long bookingId) {
        Review review = reviewRepository.findByBookingId(bookingId).orElse(null);
        if (review == null) {
            return ResponseEntity.ok(Map.of("hasReview", false));
        }
        return ResponseEntity.ok(Map.of("hasReview", true, "review", buildReviewMap(review)));
    }

    private Map<String, Object> buildReviewMap(Review r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("rating", r.getRating());
        map.put("comment", r.getComment());
        map.put("createdAt", r.getCreatedAt());
        map.put("bookingId", r.getBooking().getId());
        if (r.getStudent() != null) {
            map.put("student", Map.of(
                    "username", r.getStudent().getUsername(),
                    "fullname", r.getStudent().getFullname(),
                    "avatar", r.getStudent().getAvatar() != null ? r.getStudent().getAvatar() : ""
            ));
        }
        return map;
    }
}
