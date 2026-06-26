package com.polyhub.controller.api;

import com.polyhub.entity.Booking;
import com.polyhub.entity.BookingStatus;
import com.polyhub.entity.MentorSchedule;
import com.polyhub.entity.User;
import com.polyhub.entity.Notification;
import com.polyhub.repository.BookingRepository;
import com.polyhub.repository.MentorScheduleRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.repository.NotificationRepository;
import com.polyhub.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
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

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    // Tự động đóng các lịch hẹn quá hạn 10 phút không tham gia, hoặc đã hết thời lượng
    private void checkAndCloseExpiredBookings() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<Booking> approvedBookings = bookingRepository.findAll(); // Lấy tất cả để quét (quy mô nhỏ)
            
            List<Booking> toUpdate = new ArrayList<>();
            for (Booking b : approvedBookings) {
                if (b.getStatus() == BookingStatus.APPROVED) {
                    LocalDateTime scheduledStart = LocalDateTime.of(b.getBookingDate(), b.getStartTime());
                    
                    // Case 1: Quá 10 phút kể từ giờ hẹn mà chưa có startedAt hoặc 1 trong 2 không vào
                    if (now.isAfter(scheduledStart.plusMinutes(10))) {
                        if (b.getStartedAt() == null || !b.getStudentJoined() || !b.getMentorJoined()) {
                            b.setStatus(BookingStatus.CLOSED);
                            b.setRejectionReason("Tự động đóng do một hoặc cả hai bên không tham gia cuộc gọi sau 10 phút.");
                            toUpdate.add(b);

                            // Tạo thông báo cho cả 2 bên
                            createSystemNotification(b.getStudent(), "Lịch hẹn bị đóng", 
                                "Lịch hẹn ngày " + b.getBookingDate() + " lúc " + b.getStartTime() + " đã bị đóng do quá hạn 10 phút không tham gia.");
                            createSystemNotification(b.getMentor(), "Lịch hẹn bị đóng", 
                                "Lịch hẹn ngày " + b.getBookingDate() + " lúc " + b.getStartTime() + " đã bị đóng do quá hạn 10 phút không tham gia.");
                            continue;
                        }
                    }

                    // Case 2: Cuộc gọi đã bắt đầu và đã vượt quá thời lượng (startedAt + duration)
                    if (b.getStartedAt() != null) {
                        LocalDateTime scheduledEnd = b.getStartedAt().plusMinutes(b.getDuration());
                        if (now.isAfter(scheduledEnd)) {
                            b.setStatus(BookingStatus.CLOSED);
                            toUpdate.add(b);
                            
                            createSystemNotification(b.getStudent(), "Cuộc gọi kết thúc", 
                                "Cuộc gọi với Mentor " + b.getMentor().getFullname() + " đã kết thúc do hết thời lượng.");
                            createSystemNotification(b.getMentor(), "Cuộc gọi kết thúc", 
                                "Cuộc gọi với sinh viên " + b.getStudent().getFullname() + " đã kết thúc do hết thời lượng.");
                        }
                    }
                }
            }

            if (!toUpdate.isEmpty()) {
                bookingRepository.saveAll(toUpdate);
            }
        } catch (Exception e) {
            System.err.println("Lỗi quét đóng lịch hẹn hết hạn: " + e.getMessage());
        }
    }

    private void createSystemNotification(User recipient, String title, String content) {
        try {
            Notification n = new Notification();
            n.setUser(recipient);
            n.setTitle(title);
            n.setContent(content);
            n.setLink("/bookings");
            n.setIsRead(false);
            notificationRepository.save(n);
        } catch (Exception e) {
            System.err.println("Lỗi tạo thông báo hệ thống: " + e.getMessage());
        }
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> payload, Principal principal) {
        checkAndCloseExpiredBookings();

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

            if (bookingDate.equals(LocalDate.now()) && startTime.isBefore(LocalTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không thể đặt lịch hẹn cho khung giờ đã qua trong ngày"));
            }

            List<Integer> validDurations = Arrays.asList(1, 20, 30, 40, 50, 60);
            if (!validDurations.contains(duration)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Thời lượng cuộc gọi không hợp lệ (chỉ chấp nhận 1, 20, 30, 40, 50, 60 phút)"));
            }

            LocalTime endTime = startTime.plusMinutes(duration);

            int dayOfWeek = bookingDate.getDayOfWeek().getValue() + 1;
            List<MentorSchedule> mentorSchedules = mentorScheduleRepository.findByMentorUsername(mentorUsername);
            
            boolean isWithinSchedule = false;
            for (MentorSchedule schedule : mentorSchedules) {
                if (schedule.getDayOfWeek().equals(dayOfWeek)) {
                    if (!startTime.isBefore(schedule.getStartTime()) && !endTime.isAfter(schedule.getEndTime())) {
                        isWithinSchedule = true;
                        break;
                    }
                }
            }

            if (!isWithinSchedule) {
                return ResponseEntity.badRequest().body(Map.of("error", "Khung giờ này nằm ngoài lịch rảnh của Mentor"));
            }

            List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED);
            List<Booking> mentorBookings = bookingRepository.findBookingsByMentorAndDate(mentorUsername, bookingDate, activeStatuses);
            for (Booking b : mentorBookings) {
                if (startTime.isBefore(b.getEndTime()) && endTime.isAfter(b.getStartTime())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Mentor đã có lịch hẹn khác trong khung giờ này"));
                }
            }

            List<Booking> studentBookings = bookingRepository.findBookingsByStudentAndDate(student.getUsername(), bookingDate, activeStatuses);
            for (Booking b : studentBookings) {
                if (startTime.isBefore(b.getEndTime()) && endTime.isAfter(b.getStartTime())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã có một lịch hẹn khác trùng vào khung giờ này"));
                }
            }

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

            // Gửi thông báo hệ thống cho Mentor
            createSystemNotification(mentor, "Yêu cầu đặt lịch mới", 
                student.getFullname() + " đã đặt lịch call video với bạn ngày " + bookingDate + " lúc " + startTime + ".");

            // Gửi thông báo hệ thống cho Student
            createSystemNotification(student, "Yêu cầu đặt lịch mới", 
                "Bạn đã gửi yêu cầu đặt lịch call video với Mentor " + mentor.getFullname() + " ngày " + bookingDate + " lúc " + startTime + ".");

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dữ liệu không hợp lệ: " + e.getMessage()));
        }
    }

    @GetMapping("/student")
    public ResponseEntity<?> getStudentBookings(Principal principal) {
        checkAndCloseExpiredBookings();

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }
        List<Booking> bookings = bookingRepository.findByStudentUsernameOrderByBookingDateDescStartTimeDesc(principal.getName());
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/mentor")
    public ResponseEntity<?> getMentorBookings(Principal principal) {
        checkAndCloseExpiredBookings();

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
        checkAndCloseExpiredBookings();

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

            if (targetStatus == BookingStatus.CANCELLED) {
                if (!booking.getStudent().getUsername().equalsIgnoreCase(currentUser) &&
                        !booking.getMentor().getUsername().equalsIgnoreCase(currentUser)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Bạn không có quyền hủy lịch hẹn này"));
                }
                booking.setStatus(BookingStatus.CANCELLED);
                bookingRepository.save(booking);

                // Tạo thông báo cho bên đối phương
                if (currentUser.equalsIgnoreCase(booking.getStudent().getUsername())) {
                    createSystemNotification(booking.getMentor(), "Lịch hẹn đã bị hủy", 
                        "Sinh viên " + booking.getStudent().getFullname() + " đã hủy lịch hẹn ngày " + booking.getBookingDate() + ".");
                } else {
                    createSystemNotification(booking.getStudent(), "Lịch hẹn đã bị hủy", 
                        "Mentor " + booking.getMentor().getFullname() + " đã hủy lịch hẹn ngày " + booking.getBookingDate() + ".");
                }

                return ResponseEntity.ok(Map.of("message", "Lịch hẹn đã được hủy thành công"));
            }

            if (targetStatus == BookingStatus.CLOSED) {
                if (!booking.getStudent().getUsername().equalsIgnoreCase(currentUser) &&
                        !booking.getMentor().getUsername().equalsIgnoreCase(currentUser)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Bạn không có quyền kết thúc cuộc gọi này"));
                }
                booking.setStatus(BookingStatus.CLOSED);
                String reason = payload.get("reason");
                booking.setRejectionReason(reason != null ? reason : "Cuộc gọi video đã được kết thúc do hết thời gian hoặc do người dùng rời phòng.");
                bookingRepository.save(booking);

                // Tạo thông báo cho bên đối phương
                if (currentUser.equalsIgnoreCase(booking.getStudent().getUsername())) {
                    createSystemNotification(booking.getMentor(), "Cuộc gọi kết thúc", 
                        "Sinh viên " + booking.getStudent().getFullname() + " đã kết thúc cuộc gọi.");
                } else {
                    createSystemNotification(booking.getStudent(), "Cuộc gọi kết thúc", 
                        "Mentor " + booking.getMentor().getFullname() + " đã kết thúc cuộc gọi.");
                }

                return ResponseEntity.ok(Map.of("message", "Cuộc gọi đã được kết thúc thành công"));
            }

            if (targetStatus == BookingStatus.APPROVED || targetStatus == BookingStatus.REJECTED) {
                if (!booking.getMentor().getUsername().equalsIgnoreCase(currentUser)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Bạn không có quyền thực hiện hành động này"));
                }

                if (booking.getStatus() != BookingStatus.PENDING) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Chỉ có thể xử lý lịch hẹn đang ở trạng thái chờ duyệt"));
                }

                if (targetStatus == BookingStatus.APPROVED) {
                    booking.setStatus(BookingStatus.APPROVED);
                    booking.setRoomId("booking_" + booking.getId());
                    bookingRepository.save(booking);

                    // Gửi thông báo email và thông báo hệ thống cho sinh viên
                    emailService.sendBookingStatusEmail(
                        booking.getStudent().getEmail(), 
                        booking.getStudent().getFullname(), 
                        booking.getMentor().getFullname(), 
                        booking.getBookingDate().toString(), 
                        booking.getStartTime().toString(), 
                        "APPROVED", 
                        null
                    );
                    createSystemNotification(booking.getStudent(), "Lịch hẹn được chấp nhận", 
                        "Mentor " + booking.getMentor().getFullname() + " đã chấp nhận lịch hẹn ngày " + booking.getBookingDate() + " lúc " + booking.getStartTime() + ".");
                } else {
                    booking.setStatus(BookingStatus.REJECTED);
                    String reason = payload.get("reason");
                    booking.setRejectionReason(reason != null ? reason : "Mentor không sắp xếp được thời gian");
                    bookingRepository.save(booking);

                    // Gửi thông báo email và thông báo hệ thống cho sinh viên
                    emailService.sendBookingStatusEmail(
                        booking.getStudent().getEmail(), 
                        booking.getStudent().getFullname(), 
                        booking.getMentor().getFullname(), 
                        booking.getBookingDate().toString(), 
                        booking.getStartTime().toString(), 
                        "REJECTED", 
                        booking.getRejectionReason()
                    );
                    createSystemNotification(booking.getStudent(), "Lịch hẹn bị từ chối", 
                        "Mentor " + booking.getMentor().getFullname() + " đã từ chối lịch hẹn ngày " + booking.getBookingDate() + " lúc " + booking.getStartTime() + ". Lý do: " + booking.getRejectionReason());
                }

                return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái lịch hẹn thành công"));
            }

            return ResponseEntity.badRequest().body(Map.of("error", "Trạng thái chuyển đổi không hợp lệ"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Trạng thái không đúng định dạng"));
        }
    }

    @PostMapping("/{id}/join")
    @Transactional
    public ResponseEntity<?> joinBooking(@PathVariable("id") Long id, Principal principal) {
        checkAndCloseExpiredBookings();

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null || booking.getStatus() != BookingStatus.APPROVED) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lịch hẹn không hợp lệ hoặc chưa được duyệt"));
        }

        String username = principal.getName();
        boolean isStudent = booking.getStudent().getUsername().equalsIgnoreCase(username);
        boolean isMentor = booking.getMentor().getUsername().equalsIgnoreCase(username);

        if (!isStudent && !isMentor) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Bạn không có quyền tham gia cuộc gọi này"));
        }

        if (isStudent) {
            booking.setStudentJoined(true);
        }
        if (isMentor) {
            booking.setMentorJoined(true);
        }

        if (booking.getStartedAt() == null) {
            booking.setStartedAt(LocalDateTime.now());
        }

        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/mentor/{username}/availability")
    public ResponseEntity<?> getMentorAvailability(@PathVariable("username") String username) {
        User mentor = userRepository.findById(username).orElse(null);
        if (mentor == null || mentor.getRole() == null || !"MENTOR".equalsIgnoreCase(mentor.getRole().getId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy Mentor hoặc người dùng không phải Mentor"));
        }

        List<MentorSchedule> schedules = mentorScheduleRepository.findByMentorUsername(username);

        List<Map<String, Object>> availability = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 0; i < 14; i++) {
            LocalDate date = today.plusDays(i);
            int dayOfWeek = date.getDayOfWeek().getValue() + 1; // 2 -> 8

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

    // ======================================================
    // TÍNH NĂNG GIA HẠN THỜI GIAN (SESSION EXTENSION)
    // ======================================================

    /**
     * GET /api/bookings/{id}/remaining-time
     * Trả về thông tin thời gian còn lại của cuộc gọi đang diễn ra.
     * Mobile sẽ poll endpoint này mỗi 30 giây để sync trạng thái.
     */
    @GetMapping("/{id}/remaining-time")
    public ResponseEntity<?> getRemainingTime(@PathVariable("id") Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy lịch hẹn"));
        }

        String username = principal.getName();
        boolean isStudent = booking.getStudent().getUsername().equalsIgnoreCase(username);
        boolean isMentor = booking.getMentor().getUsername().equalsIgnoreCase(username);

        if (!isStudent && !isMentor) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Bạn không có quyền truy cập cuộc gọi này"));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", booking.getStatus().toString());
        result.put("duration", booking.getDuration());
        result.put("extensionCount", booking.getExtensionCount() != null ? booking.getExtensionCount() : 0);
        result.put("maxExtensions", booking.getMaxExtensions() != null ? booking.getMaxExtensions() : 3);
        result.put("extendedMinutes", booking.getExtendedMinutes() != null ? booking.getExtendedMinutes() : 0);

        int extensionCount = booking.getExtensionCount() != null ? booking.getExtensionCount() : 0;
        int maxExtensions = booking.getMaxExtensions() != null ? booking.getMaxExtensions() : 3;
        boolean canExtend = extensionCount < maxExtensions;
        result.put("canExtend", canExtend);

        if (booking.getStartedAt() != null && booking.getStatus() == BookingStatus.APPROVED) {
            LocalDateTime endTime = booking.getStartedAt().plusMinutes(booking.getDuration());
            long remainingSeconds = java.time.Duration.between(LocalDateTime.now(), endTime).getSeconds();
            result.put("remainingSeconds", Math.max(0, remainingSeconds));
            result.put("startedAt", booking.getStartedAt().toString());
            result.put("calculatedEndAt", endTime.toString());
        } else {
            result.put("remainingSeconds", 0);
            result.put("startedAt", null);
            result.put("calculatedEndAt", null);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/bookings/{id}/extend
     * Gia hạn thời gian cuộc gọi thêm X phút.
     * Body: { "additionalMinutes": 10 | 20 | 30 }
     * Chỉ mentor hoặc student của booking mới được gọi.
     * Tối đa 3 lần gia hạn mỗi session.
     */
    @PostMapping("/{id}/extend")
    @Transactional
    public ResponseEntity<?> extendBooking(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy lịch hẹn"));
        }

        // Chỉ cho phép gia hạn khi booking đang ở trạng thái APPROVED và đã bắt đầu
        if (booking.getStatus() != BookingStatus.APPROVED) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cuộc gọi không đang diễn ra hoặc đã kết thúc"));
        }

        if (booking.getStartedAt() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cuộc gọi chưa được bắt đầu"));
        }

        // Kiểm tra quyền
        String username = principal.getName();
        boolean isStudent = booking.getStudent().getUsername().equalsIgnoreCase(username);
        boolean isMentor = booking.getMentor().getUsername().equalsIgnoreCase(username);

        if (!isStudent && !isMentor) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Bạn không có quyền gia hạn cuộc gọi này"));
        }

        // Kiểm tra giới hạn gia hạn
        int currentExtCount = booking.getExtensionCount() != null ? booking.getExtensionCount() : 0;
        int maxExtensions = booking.getMaxExtensions() != null ? booking.getMaxExtensions() : 3;

        if (currentExtCount >= maxExtensions) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Đã đạt giới hạn gia hạn (" + maxExtensions + " lần). Không thể gia hạn thêm.",
                "extensionCount", currentExtCount,
                "maxExtensions", maxExtensions
            ));
        }

        // Validate số phút gia hạn
        Object additionalMinutesObj = payload.get("additionalMinutes");
        if (additionalMinutesObj == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng chỉ định số phút muốn gia hạn"));
        }

        int additionalMinutes;
        try {
            additionalMinutes = Integer.parseInt(additionalMinutesObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Số phút gia hạn không hợp lệ"));
        }

        List<Integer> validExtensions = Arrays.asList(10, 20, 30);
        if (!validExtensions.contains(additionalMinutes)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Thời gian gia hạn chỉ được là 10, 20 hoặc 30 phút"));
        }

        // Cập nhật booking
        int newDuration = booking.getDuration() + additionalMinutes;
        int newExtendedMinutes = (booking.getExtendedMinutes() != null ? booking.getExtendedMinutes() : 0) + additionalMinutes;

        booking.setDuration(newDuration);
        booking.setExtensionCount(currentExtCount + 1);
        booking.setExtendedMinutes(newExtendedMinutes);

        // Cập nhật endTime (theo startTime gốc của booking, không phải startedAt)
        LocalTime newEndTime = booking.getStartTime().plusMinutes(newDuration);
        booking.setEndTime(newEndTime);

        Booking saved = bookingRepository.save(booking);

        // Tính thời gian còn lại sau gia hạn
        LocalDateTime newEndAt = booking.getStartedAt().plusMinutes(newDuration);
        long remainingSeconds = java.time.Duration.between(LocalDateTime.now(), newEndAt).getSeconds();

        // Gửi thông báo cho bên đối phương
        String extenderName = isStudent ? booking.getStudent().getFullname() : booking.getMentor().getFullname();
        User notifyTarget = isStudent ? booking.getMentor() : booking.getStudent();

        createSystemNotification(notifyTarget, "Cuộc gọi được gia hạn",
            extenderName + " đã gia hạn cuộc gọi thêm " + additionalMinutes + " phút. Thời gian mới: " + newDuration + " phút.");

        // Trả về thông tin đầy đủ sau gia hạn
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Gia hạn cuộc gọi thành công! Thêm " + additionalMinutes + " phút.");
        response.put("additionalMinutes", additionalMinutes);
        response.put("newDuration", newDuration);
        response.put("extensionCount", saved.getExtensionCount());
        response.put("maxExtensions", saved.getMaxExtensions());
        response.put("extendedMinutes", saved.getExtendedMinutes());
        response.put("canExtend", saved.getExtensionCount() < saved.getMaxExtensions());
        response.put("remainingSeconds", Math.max(0, remainingSeconds));
        response.put("calculatedEndAt", newEndAt.toString());

        return ResponseEntity.ok(response);
    }
}

