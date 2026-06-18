package com.polyhub.controller.api;

import com.polyhub.entity.Booking;
import com.polyhub.entity.BookingStatus;
import com.polyhub.entity.MentorSchedule;
import com.polyhub.entity.User;
import com.polyhub.repository.BookingRepository;
import com.polyhub.repository.MentorScheduleRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingApiController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private MentorScheduleRepository mentorScheduleRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        User student = userRepository.findById(principal.getName()).orElse(null);
        if (student == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Người dùng không tồn tại"));
        }

        String mentorUsername = (String) payload.get("mentorUsername");
        if (mentorUsername == null || mentorUsername.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chọn Mentor"));
        }

        if (student.getUsername().equalsIgnoreCase(mentorUsername)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bạn không thể tự đặt lịch hẹn với chính mình"));
        }

        User mentor = userRepository.findById(mentorUsername).orElse(null);
        if (mentor == null || mentor.getRole() == null || !"MENTOR".equalsIgnoreCase(mentor.getRole().getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mentor không hợp lệ"));
        }

        try {
            LocalDate bookingDate = LocalDate.parse((String) payload.get("bookingDate"));
            LocalTime startTime = LocalTime.parse((String) payload.get("startTime"));
            Integer duration = Integer.parseInt(payload.get("duration").toString());
            String note = (String) payload.get("note");

            if (bookingDate.isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không thể đặt lịch hẹn cho những ngày trong quá khứ"));
            }

            // Chỉ cho phép các mức thời lượng quy định: 20, 30, 40, 50, 60
            List<Integer> validDurations = Arrays.asList(20, 30, 40, 50, 60);
            if (!validDurations.contains(duration)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Thời lượng cuộc gọi không hợp lệ (chỉ chấp nhận 20, 30, 40, 50, 60 phút)"));
            }

            LocalTime endTime = startTime.plusMinutes(duration);

            // 1. Kiểm tra xem giờ đặt có nằm trong lịch rảnh định kỳ của Mentor hay không
            // Java DayOfWeek: Monday = 1, Sunday = 7
            // Polyhub DayOfWeek: Thứ 2 = 2, Chủ Nhật = 8
            int dayOfWeek = bookingDate.getDayOfWeek().getValue() + 1;
            List<MentorSchedule> mentorSchedules = mentorScheduleRepository.findByMentorUsername(mentorUsername);
            
            boolean isWithinSchedule = false;
            for (MentorSchedule schedule : mentorSchedules) {
                if (schedule.getDayOfWeek().equals(dayOfWeek)) {
                    // Check if [startTime, endTime] lies entirely inside [schedule.startTime, schedule.endTime]
                    if (!startTime.isBefore(schedule.getStartTime()) && !endTime.isAfter(schedule.getEndTime())) {
                        isWithinSchedule = true;
                        break;
                    }
                }
            }

            if (!isWithinSchedule) {
                return ResponseEntity.badRequest().body(Map.of("error", "Khung giờ này nằm ngoài lịch rảnh của Mentor"));
            }

            // 2. Kiểm tra trùng lặp lịch hẹn của Mentor
            List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED);
            List<Booking> mentorBookings = bookingRepository.findBookingsByMentorAndDate(mentorUsername, bookingDate, activeStatuses);
            for (Booking b : mentorBookings) {
                if (startTime.isBefore(b.getEndTime()) && endTime.isAfter(b.getStartTime())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Mentor đã có lịch hẹn khác trong khung giờ này"));
                }
            }

            // 3. Kiểm tra trùng lặp lịch hẹn của Sinh viên
            List<Booking> studentBookings = bookingRepository.findBookingsByStudentAndDate(student.getUsername(), bookingDate, activeStatuses);
            for (Booking b : studentBookings) {
                if (startTime.isBefore(b.getEndTime()) && endTime.isAfter(b.getStartTime())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã có một lịch hẹn khác trùng vào khung giờ này"));
                }
            }

            // Tạo Booking
            Booking booking = new Booking();
            booking.setStudent(student);
            booking.setMentor(mentor);
            booking.setBookingDate(bookingDate);
            booking.setStartTime(startTime);
            booking.setEndTime(endTime);
            booking.setDuration(duration);
            booking.setStatus(BookingStatus.PENDING);
            booking.setNote(note);

            Booking saved = bookingRepository.save(booking);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dữ liệu không hợp lệ: " + e.getMessage()));
        }
    }

    @GetMapping("/student")
    public ResponseEntity<?> getStudentBookings(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }
        List<Booking> bookings = bookingRepository.findByStudentUsernameOrderByBookingDateDescStartTimeDesc(principal.getName());
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/mentor")
    public ResponseEntity<?> getMentorBookings(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }
        List<Booking> bookings = bookingRepository.findByMentorUsernameOrderByBookingDateDescStartTimeDesc(principal.getName());
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/{id}/status")
    @Transactional
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> payload,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy lịch hẹn"));
        }

        String targetStatusStr = payload.get("status");
        if (targetStatusStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Trạng thái không hợp lệ"));
        }

        try {
            BookingStatus targetStatus = BookingStatus.valueOf(targetStatusStr.toUpperCase());
            String currentUser = principal.getName();

            // Quyền hủy lịch hẹn: Cả student và mentor đều hủy được
            if (targetStatus == BookingStatus.CANCELLED) {
                if (!booking.getStudent().getUsername().equalsIgnoreCase(currentUser) &&
                        !booking.getMentor().getUsername().equalsIgnoreCase(currentUser)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Bạn không có quyền hủy lịch hẹn này"));
                }
                booking.setStatus(BookingStatus.CANCELLED);
                bookingRepository.save(booking);
                return ResponseEntity.ok(Map.of("message", "Lịch hẹn đã được hủy thành công"));
            }

            // Quyền duyệt/từ chối lịch hẹn: Chỉ dành cho Mentor
            if (targetStatus == BookingStatus.APPROVED || targetStatus == BookingStatus.REJECTED) {
                if (!booking.getMentor().getUsername().equalsIgnoreCase(currentUser)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Bạn không có quyền thực hiện hành động này"));
                }

                if (booking.getStatus() != BookingStatus.PENDING) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Chỉ có thể xử lý lịch hẹn đang ở trạng thái chờ duyệt"));
                }

                if (targetStatus == BookingStatus.APPROVED) {
                    booking.setStatus(BookingStatus.APPROVED);
                    // Tự động sinh phòng video call nội bộ ZegoCloud
                    booking.setRoomId("booking_" + booking.getId());
                } else {
                    booking.setStatus(BookingStatus.REJECTED);
                    String reason = payload.get("reason");
                    booking.setRejectionReason(reason != null ? reason : "Mentor không sắp xếp được thời gian");
                }

                bookingRepository.save(booking);
                return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái lịch hẹn thành công"));
            }

            return ResponseEntity.badRequest().body(Map.of("error", "Trạng thái chuyển đổi không hợp lệ"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Trạng thái không đúng định dạng"));
        }
    }

    @GetMapping("/mentor/{username}/availability")
    public ResponseEntity<?> getMentorAvailability(@PathVariable("username") String username) {
        User mentor = userRepository.findById(username).orElse(null);
        if (mentor == null || mentor.getRole() == null || !"MENTOR".equalsIgnoreCase(mentor.getRole().getId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy Mentor hoặc người dùng không phải Mentor"));
        }

        // Lấy lịch rảnh định kỳ hàng tuần
        List<MentorSchedule> schedules = mentorScheduleRepository.findByMentorUsername(username);

        // Chuẩn bị dữ liệu khả dụng cho 14 ngày tiếp theo (bắt đầu từ hôm nay)
        List<Map<String, Object>> availability = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 0; i < 14; i++) {
            LocalDate date = today.plusDays(i);
            int dayOfWeek = date.getDayOfWeek().getValue() + 1; // 2 -> 8

            // Tìm các slot rảnh của mentor vào ngày thứ này trong tuần
            List<Map<String, String>> slotsList = new ArrayList<>();
            boolean isDayOfWeekAvailable = false;
            for (MentorSchedule schedule : schedules) {
                if (schedule.getDayOfWeek().equals(dayOfWeek)) {
                    isDayOfWeekAvailable = true;
                    Map<String, String> slotMap = new HashMap<>();
                    slotMap.put("startTime", schedule.getStartTime().toString());
                    slotMap.put("endTime", schedule.getEndTime().toString());
                    slotsList.add(slotMap);
                }
            }

            // Lấy danh sách lịch bận của mentor ngày hôm đó (APPROVED hoặc PENDING)
            List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED);
            List<Booking> dateBookings = bookingRepository.findBookingsByMentorAndDate(username, date, activeStatuses);
            List<Map<String, Object>> busySlots = new ArrayList<>();
            for (Booking b : dateBookings) {
                Map<String, Object> busyMap = new HashMap<>();
                busyMap.put("startTime", b.getStartTime().toString());
                busyMap.put("endTime", b.getEndTime().toString());
                busyMap.put("status", b.getStatus().toString());
                busySlots.add(busyMap);
            }

            Map<String, Object> dayInfo = new HashMap<>();
            dayInfo.put("date", date.toString());
            dayInfo.put("dayOfWeek", dayOfWeek);
            dayInfo.put("isAvailable", isDayOfWeekAvailable);
            dayInfo.put("slots", slotsList);
            dayInfo.put("busySlots", busySlots);
            availability.add(dayInfo);
        }

        return ResponseEntity.ok(availability);
    }
}
