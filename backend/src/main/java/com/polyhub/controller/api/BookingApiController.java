package com.polyhub.controller.api;

import com.polyhub.entity.Booking;
import com.polyhub.entity.BookingStatus;
import com.polyhub.entity.MentorSchedule;
import com.polyhub.entity.User;
import com.polyhub.entity.Notification;
import com.polyhub.entity.BookingExtension;
import com.polyhub.entity.MentorBusy;
import com.polyhub.entity.BookingPriority;
import com.polyhub.entity.PriorityStatus;
import com.polyhub.entity.AiFeedbackLoop;
import com.polyhub.repository.BookingRepository;
import com.polyhub.repository.MentorScheduleRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.repository.NotificationRepository;
import com.polyhub.repository.BookingExtensionRepository;
import com.polyhub.repository.MentorBusyRepository;
import com.polyhub.repository.BookingPriorityRepository;
import com.polyhub.repository.AiFeedbackLoopRepository;
import com.polyhub.service.EmailService;
import com.polyhub.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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

    @Autowired
    private BookingExtensionRepository bookingExtensionRepository;

    @Autowired
    private MentorBusyRepository mentorBusyRepository;

    @Autowired
    private BookingPriorityRepository bookingPriorityRepository;

    @Autowired
    private AiFeedbackLoopRepository aiFeedbackLoopRepository;

    @Autowired
    private AiService aiService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Bộ giữ chỗ tạm thời (Lock slot) trong 3 phút
    private static class SlotLock {
        String studentUsername;
        LocalDateTime expiresAt;
        SlotLock(String studentUsername, LocalDateTime expiresAt) {
            this.studentUsername = studentUsername;
            this.expiresAt = expiresAt;
        }
    }
    private final Map<String, SlotLock> activeLocks = new java.util.concurrent.ConcurrentHashMap<>();

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

                // Case 3: Tự động từ chối các lịch hẹn PENDING đã quá giờ bắt đầu
                if (b.getStatus() == BookingStatus.PENDING) {
                    LocalDateTime scheduledStart = LocalDateTime.of(b.getBookingDate(), b.getStartTime());
                    if (now.isAfter(scheduledStart)) {
                        b.setStatus(BookingStatus.REJECTED);
                        b.setRejectionReason("Tự động từ chối do quá hạn thời gian phê duyệt (lịch hẹn đã bắt đầu).");
                        toUpdate.add(b);

                        createSystemNotification(b.getStudent(), "Lịch hẹn bị hủy tự động", 
                            "Yêu cầu đặt lịch ngày " + b.getBookingDate() + " lúc " + b.getStartTime() + " đã bị hủy tự động do quá giờ bắt đầu mà chưa được Mentor phê duyệt.");
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
                boolean dateMatches = false;
                if (schedule.getSpecificDate() != null) {
                    dateMatches = schedule.getSpecificDate().equals(bookingDate);
                } else {
                    dateMatches = schedule.getDayOfWeek().equals(dayOfWeek);
                    if (dateMatches && schedule.getExpireDate() != null) {
                        dateMatches = !bookingDate.isAfter(schedule.getExpireDate());
                    }
                }

                if (dateMatches) {
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
                    LocalDateTime scheduledStart = LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
                    if (LocalDateTime.now().isAfter(scheduledStart)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Lịch hẹn đã quá thời gian bắt đầu, không thể phê duyệt"));
                    }
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

                    // Cấp quyền ưu tiên đặt lại lịch 48h cho sinh viên khi bị từ chối
                    try {
                        BookingPriority priority = new BookingPriority();
                        priority.setStudent(booking.getStudent());
                        priority.setMentor(booking.getMentor());
                        priority.setOriginalBookingId(booking.getId());
                        priority.setDuration(booking.getDuration());
                        priority.setExpiresAt(LocalDateTime.now().plusDays(2));
                        priority.setPriorityOrder(booking.getCreatedAt() != null ? booking.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() : System.currentTimeMillis());
                        priority.setStatus(PriorityStatus.ACTIVE);
                        bookingPriorityRepository.save(priority);
                    } catch (Exception ex) {
                        System.err.println("Failed to save priority: " + ex.getMessage());
                    }

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


    // ======================================================
    // GỢI Ý MENTOR THAY THẾ
    // ======================================================

    /**
     * Trả về tối đa 5 mentor khác có lịch rảnh trùng hoặc gần với khung giờ đã chỉ định.
     * Query params: date (yyyy-MM-dd), startTime (HH:mm), endTime (HH:mm), excludeMentor (username)
     */
    @GetMapping("/suggest-mentors")
    public ResponseEntity<?> suggestMentors(
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false, defaultValue = "") String excludeMentor,
            Principal principal) {

        LocalDate targetDate = LocalDate.parse(date);
        LocalTime targetStart = LocalTime.parse(startTime.length() == 5 ? startTime + ":00" : startTime);
        LocalTime targetEnd   = LocalTime.parse(endTime.length()   == 5 ? endTime   + ":00" : endTime);
        // Mở rộng ±2 giờ để tìm mentor gần đó
        LocalTime windowStart = targetStart.minusHours(2);
        LocalTime windowEnd   = targetEnd.plusHours(2);

        // Lấy tất cả mentor trong hệ thống
        List<User> allMentors = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "MENTOR".equalsIgnoreCase(u.getRole().getId()))
                .filter(u -> !u.getUsername().equals(excludeMentor))
                .toList();

        int dayOfWeek = targetDate.getDayOfWeek().getValue() + 1; // 2..8
        LocalDateTime nowDt = LocalDateTime.now();
        activeLocks.entrySet().removeIf(e -> e.getValue().expiresAt.isBefore(nowDt));

        List<Map<String, Object>> result = new ArrayList<>();

        for (User mentor : allMentors) {
            List<MentorSchedule> schedules = mentorScheduleRepository.findByMentorUsername(mentor.getUsername());

            // Kiểm tra mentor có khung nào rảnh gần target không
            boolean hasOverlap = false;
            List<Map<String, String>> matchedSlots = new ArrayList<>();

            for (MentorSchedule sch : schedules) {
                boolean dateMatch;
                if (sch.getSpecificDate() != null) {
                    dateMatch = sch.getSpecificDate().equals(targetDate);
                } else {
                    dateMatch = sch.getDayOfWeek().equals(dayOfWeek);
                    if (dateMatch && sch.getExpireDate() != null) {
                        dateMatch = !targetDate.isAfter(sch.getExpireDate());
                    }
                }
                if (!dateMatch) continue;

                LocalTime slotStart = sch.getStartTime();
                LocalTime slotEnd   = sch.getEndTime();

                // Kiểm tra slot có nằm trong cửa sổ ±2h không (overlap)
                boolean inWindow = slotStart.isBefore(windowEnd) && slotEnd.isAfter(windowStart);
                if (inWindow) {
                    hasOverlap = true;
                    Map<String, String> sm = new HashMap<>();
                    sm.put("startTime", slotStart.toString());
                    sm.put("endTime", slotEnd.toString());
                    matchedSlots.add(sm);
                }
            }

            if (!hasOverlap) continue;

            // Kiểm tra mentor có thực sự rảnh (không bị booking/busy) tại target time không
            List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED);
            List<Booking> existing = bookingRepository.findBookingsByMentorAndDate(mentor.getUsername(), targetDate, activeStatuses);
            boolean isBusyAtTarget = existing.stream().anyMatch(b -> {
                return b.getStartTime().isBefore(targetEnd) && b.getEndTime().isAfter(targetStart);
            });

            List<MentorBusy> busyPeriods = mentorBusyRepository.findOverlappingBusyPeriods(
                    mentor.getUsername(),
                    targetDate.atTime(targetStart),
                    targetDate.atTime(targetEnd)
            );
            if (!busyPeriods.isEmpty()) isBusyAtTarget = true;

            Map<String, Object> info = new LinkedHashMap<>();
            info.put("username", mentor.getUsername());
            info.put("fullname", mentor.getFullname());
            info.put("avatar", mentor.getAvatar());
            info.put("major", mentor.getMajor());
            info.put("availableAtExact", !isBusyAtTarget);
            info.put("matchedSlots", matchedSlots);
            result.add(info);

            if (result.size() >= 5) break;
        }

        // Sắp xếp: mentor rảnh đúng giờ lên đầu
        result.sort((a, b) -> Boolean.compare(!(Boolean) a.get("availableAtExact"), !(Boolean) b.get("availableAtExact")));

        return ResponseEntity.ok(result);
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
        LocalDateTime nowTime = LocalDateTime.now();

        // Dọn dẹp các lock hết hạn trước khi quét
        activeLocks.entrySet().removeIf(entry -> entry.getValue().expiresAt.isBefore(nowTime));

        for (int i = 0; i < 14; i++) {
            LocalDate date = today.plusDays(i);
            int dayOfWeek = date.getDayOfWeek().getValue() + 1; // 2 -> 8

            List<Map<String, String>> slotsList = new ArrayList<>();
            boolean isDayOfWeekAvailable = false;
            for (MentorSchedule schedule : schedules) {
                boolean dateMatches = false;
                if (schedule.getSpecificDate() != null) {
                    dateMatches = schedule.getSpecificDate().equals(date);
                } else {
                    dateMatches = schedule.getDayOfWeek().equals(dayOfWeek);
                    if (dateMatches && schedule.getExpireDate() != null) {
                        dateMatches = !date.isAfter(schedule.getExpireDate());
                    }
                }

                if (dateMatches) {
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
            
            // 1. Lịch bận do booking hiện tại
            for (Booking b : dateBookings) {
                Map<String, Object> busyMap = new HashMap<>();
                busyMap.put("startTime", b.getStartTime().toString());
                busyMap.put("endTime", b.getEndTime().toString());
                busyMap.put("status", b.getStatus().toString());
                busySlots.add(busyMap);
            }

            // 2. Lịch bận đột xuất của Mentor (Vacation mode)
            List<MentorBusy> busyPeriods = mentorBusyRepository.findOverlappingBusyPeriods(
                    username, date.atStartOfDay(), date.atTime(LocalTime.MAX)
            );
            for (MentorBusy mb : busyPeriods) {
                Map<String, Object> busyMap = new HashMap<>();
                LocalTime startLocal = mb.getStartTime().toLocalDate().isBefore(date) ? LocalTime.MIN : mb.getStartTime().toLocalTime();
                LocalTime endLocal = mb.getEndTime().toLocalDate().isAfter(date) ? LocalTime.MAX : mb.getEndTime().toLocalTime();
                busyMap.put("startTime", startLocal.toString());
                busyMap.put("endTime", endLocal.toString());
                busyMap.put("status", "BUSY");
                busyMap.put("reason", mb.getReason());
                busySlots.add(busyMap);
            }

            // 3. Khóa giữ chỗ tạm thời (LOCK_CHOOSING)
            activeLocks.forEach((key, lock) -> {
                String prefix = username + "_" + date.toString() + "_";
                if (key.startsWith(prefix) && lock.expiresAt.isAfter(nowTime)) {
                    String startTimeStr = key.substring(prefix.length());
                    LocalTime sTime = LocalTime.parse(startTimeStr);
                    // Giả sử thời lượng lock hiển thị 30 phút
                    LocalTime eTime = sTime.plusMinutes(30);

                    Map<String, Object> busyMap = new HashMap<>();
                    busyMap.put("startTime", sTime.toString());
                    busyMap.put("endTime", eTime.toString());
                    busyMap.put("status", "LOCK_CHOOSING");
                    busyMap.put("lockedBy", lock.studentUsername);
                    busySlots.add(busyMap);
                }
            });

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
     * Lấy giới hạn gia hạn tối đa khả dụng dựa trên lịch trống thực tế tiếp theo của Mentor.
     */
    @GetMapping("/{id}/extend-limit")
    public ResponseEntity<?> getExtendLimit(@PathVariable("id") Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy lịch hẹn"));
        }

        LocalDateTime start = booking.getStartedAt();
        if (start == null) {
            start = LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
        }
        int totalMinutes = booking.getDuration() + (booking.getExtendedMinutes() != null ? booking.getExtendedMinutes() : 0);
        LocalDateTime currentEnd = start.plusMinutes(totalMinutes);

        // Tìm lịch bận/booking tiếp theo của Mentor
        List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED);
        List<Booking> mentorBookings = bookingRepository.findBookingsByMentorAndDate(
                booking.getMentor().getUsername(), booking.getBookingDate(), activeStatuses
        );

        LocalDateTime nextBookingStart = null;
        for (Booking b : mentorBookings) {
            if (b.getId().equals(booking.getId())) continue;
            LocalDateTime bStart = LocalDateTime.of(b.getBookingDate(), b.getStartTime());
            if (bStart.isAfter(currentEnd) || bStart.isEqual(currentEnd)) {
                if (nextBookingStart == null || bStart.isBefore(nextBookingStart)) {
                    nextBookingStart = bStart;
                }
            }
        }

        // Tìm ca rảnh trong ngày
        int dayOfWeek = booking.getBookingDate().getDayOfWeek().getValue() + 1;
        List<MentorSchedule> schedules = mentorScheduleRepository.findByMentorUsername(booking.getMentor().getUsername());
        LocalTime scheduleEndTime = null;
        for (MentorSchedule ms : schedules) {
            if (ms.getDayOfWeek().equals(dayOfWeek)) {
                if (scheduleEndTime == null || ms.getEndTime().isAfter(scheduleEndTime)) {
                    scheduleEndTime = ms.getEndTime();
                }
            }
        }

        LocalDateTime scheduleEnd = scheduleEndTime != null 
                ? LocalDateTime.of(booking.getBookingDate(), scheduleEndTime) 
                : currentEnd.plusMinutes(60);

        LocalDateTime limitEnd = nextBookingStart != null && nextBookingStart.isBefore(scheduleEnd) 
                ? nextBookingStart 
                : scheduleEnd;

        long maxExtendableMinutes = java.time.Duration.between(currentEnd, limitEnd).toMinutes();
        maxExtendableMinutes = Math.max(0, maxExtendableMinutes);

        // Các mốc chọn: 3, 5, 10, 15, 20, 25, 30 phút
        List<Integer> options = Arrays.asList(3, 5, 10, 15, 20, 25, 30);
        List<Integer> allowedOptions = new ArrayList<>();
        for (Integer opt : options) {
            if (opt <= maxExtendableMinutes) {
                allowedOptions.add(opt);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("maxExtendableMinutes", maxExtendableMinutes);
        response.put("allowedOptions", allowedOptions);
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thời gian còn lại của cuộc gọi.
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

        LocalDateTime start = booking.getStartedAt();
        if (start == null) {
            start = LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
        }

        int totalMinutes = booking.getDuration();
        LocalDateTime endAt = start.plusMinutes(totalMinutes);
        long remainingSeconds = java.time.Duration.between(LocalDateTime.now(), endAt).getSeconds();
        remainingSeconds = Math.max(0, remainingSeconds);

        int currentExtCount = booking.getExtensionCount() != null ? booking.getExtensionCount() : 0;
        int maxExtensions = booking.getMaxExtensions() != null ? booking.getMaxExtensions() : 2;

        Map<String, Object> response = new HashMap<>();
        response.put("remainingSeconds", remainingSeconds);
        response.put("extensionCount", currentExtCount);
        response.put("maxExtensions", maxExtensions);
        response.put("extendedMinutes", booking.getExtendedMinutes() != null ? booking.getExtendedMinutes() : 0);
        response.put("canExtend", currentExtCount < maxExtensions);

        return ResponseEntity.ok(response);
    }

    /**
     * Thực hiện gia hạn cuộc gọi.
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

        if (booking.getStatus() != BookingStatus.APPROVED) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cuộc gọi không đang diễn ra hoặc đã kết thúc"));
        }

        int currentExtCount = booking.getExtensionCount() != null ? booking.getExtensionCount() : 0;
        int maxExtensions = booking.getMaxExtensions() != null ? booking.getMaxExtensions() : 2;

        if (currentExtCount >= maxExtensions) {
            return ResponseEntity.badRequest().body(Map.of("error", "Đã đạt giới hạn tối đa " + maxExtensions + " lần gia hạn."));
        }

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

        List<Integer> validOptions = Arrays.asList(3, 5, 10, 15, 20, 25, 30);
        if (!validOptions.contains(additionalMinutes)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mốc phút gia hạn phải là 3, 5, 10, 15, 20, 25 hoặc 30 phút"));
        }

        LocalDateTime start = booking.getStartedAt();
        if (start == null) {
            start = LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());
        }
        int totalMinutes = booking.getDuration() + (booking.getExtendedMinutes() != null ? booking.getExtendedMinutes() : 0);
        LocalDateTime currentEnd = start.plusMinutes(totalMinutes);
        LocalDateTime targetEnd = currentEnd.plusMinutes(additionalMinutes);

        // Kiểm tra xem targetEnd có đè lên lịch khác không
        List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED);
        List<Booking> mentorBookings = bookingRepository.findBookingsByMentorAndDate(
                booking.getMentor().getUsername(), booking.getBookingDate(), activeStatuses
        );

        for (Booking b : mentorBookings) {
            if (b.getId().equals(booking.getId())) continue;
            LocalDateTime bStart = LocalDateTime.of(b.getBookingDate(), b.getStartTime());
            LocalDateTime bEnd = LocalDateTime.of(b.getBookingDate(), b.getEndTime());
            if (targetEnd.isAfter(bStart) && currentEnd.isBefore(bEnd)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Không thể gia hạn do trùng lịch bận tiếp theo của Mentor"));
            }
        }

        // Cập nhật booking
        int newDuration = booking.getDuration() + additionalMinutes;
        int newExtendedMinutes = (booking.getExtendedMinutes() != null ? booking.getExtendedMinutes() : 0) + additionalMinutes;

        booking.setDuration(newDuration);
        booking.setExtensionCount(currentExtCount + 1);
        booking.setExtendedMinutes(newExtendedMinutes);
        booking.setEndTime(booking.getEndTime().plusMinutes(additionalMinutes));

        Booking saved = bookingRepository.save(booking);

        // Lưu lịch sử gia hạn
        BookingExtension extension = new BookingExtension();
        extension.setBooking(saved);
        extension.setAdditionalMinutes(additionalMinutes);
        bookingExtensionRepository.save(extension);

        // Tính thời gian còn lại sau gia hạn
        LocalDateTime newEndAt = start.plusMinutes(newDuration);
        long remainingSeconds = java.time.Duration.between(LocalDateTime.now(), newEndAt).getSeconds();

        // Gửi thông báo hệ thống cho bên đối phương
        boolean isStudent = booking.getStudent().getUsername().equalsIgnoreCase(principal.getName());
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

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteBooking(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("message", "Vui lòng đăng nhập"));
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("message", "Không tìm thấy user"));
        }

        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Không tìm thấy lịch hẹn"));
        }

        if (booking.getStatus() != BookingStatus.CANCELLED && booking.getStatus() != BookingStatus.REJECTED && booking.getStatus() != BookingStatus.CLOSED) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Chỉ có thể xóa lịch hẹn đã kết thúc, đã hủy hoặc bị từ chối"));
        }

        if (!booking.getStudent().getUsername().equals(user.getUsername()) && !booking.getMentor().getUsername().equals(user.getUsername())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Collections.singletonMap("message", "Không có quyền xóa lịch hẹn này"));
        }

        bookingRepository.delete(booking);
        return ResponseEntity.ok(Collections.singletonMap("message", "Đã xóa lịch hẹn thành công"));
    }

    /**
     * Báo bận đột xuất của Mentor.
     * Hệ thống tự động hủy các booking trùng và cấp quyền ưu tiên cho sinh viên.
     */
    @PostMapping("/mentor/busy")
    @Transactional
    public ResponseEntity<?> setMentorBusy(
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        User mentor = userRepository.findById(principal.getName()).orElse(null);
        if (mentor == null || mentor.getRole() == null || !"MENTOR".equalsIgnoreCase(mentor.getRole().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Chỉ Mentor mới có thể báo bận"));
        }

        try {
            String startStr = ((String) payload.get("startTime")).trim();
            String endStr = ((String) payload.get("endTime")).trim();
            
            LocalDateTime startTime;
            LocalDateTime endTime;
            // Parse start time
            try {
                java.time.OffsetDateTime odtStart = java.time.OffsetDateTime.parse(startStr, java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                startTime = odtStart.atZoneSameInstant(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toLocalDateTime();
            } catch (Exception e) {
                try {
                    startTime = java.time.LocalDate.parse(startStr).atStartOfDay();
                } catch (Exception ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Thời gian bắt đầu không hợp lệ: " + startStr));
                }
            }
            // Parse end time
            try {
                java.time.OffsetDateTime odtEnd = java.time.OffsetDateTime.parse(endStr, java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                endTime = odtEnd.atZoneSameInstant(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toLocalDateTime();
            } catch (Exception e) {
                try {
                    endTime = java.time.LocalDate.parse(endStr).atStartOfDay();
                } catch (Exception ex) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Thời gian kết thúc không hợp lệ: " + endStr));
                }
            }

            String reason = (String) payload.get("reason");

            if (startTime.isAfter(endTime)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Thời gian bắt đầu phải trước thời gian kết thúc"));
            }

            if (startTime.isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Thời gian báo bận không thể ở quá khứ"));
            }

            // Lưu khoảng bận
            MentorBusy busy = new MentorBusy();
            busy.setMentor(mentor);
            busy.setStartTime(startTime);
            busy.setEndTime(endTime);
            busy.setReason(reason);
            busy.setReliabilityImpact(0.0);
            busy.setAdminApproved(false);
            MentorBusy savedBusy = mentorBusyRepository.save(busy);

            // Hủy hàng loạt (Bulk Cancel)
            List<BookingStatus> activeStatuses = Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED);
            List<Booking> allBookings = bookingRepository.findAll();
            List<Booking> toCancel = new ArrayList<>();
            for (Booking b : allBookings) {
                if (b.getMentor().getUsername().equalsIgnoreCase(mentor.getUsername()) &&
                        activeStatuses.contains(b.getStatus())) {
                    LocalDateTime bStart = LocalDateTime.of(b.getBookingDate(), b.getStartTime());
                    LocalDateTime bEnd = LocalDateTime.of(b.getBookingDate(), b.getEndTime());
                    if (bStart.isBefore(endTime) && bEnd.isAfter(startTime)) {
                        toCancel.add(b);
                    }
                }
            }

            for (Booking b : toCancel) {
                b.setStatus(BookingStatus.CANCELLED);
                b.setRejectionReason("Mentor báo bận đột xuất: " + reason);
                bookingRepository.save(b);

                // Cấp quyền ưu tiên đặt lại lịch
                BookingPriority priority = new BookingPriority();
                priority.setStudent(b.getStudent());
                priority.setMentor(mentor);
                priority.setOriginalBookingId(b.getId());
                priority.setDuration(b.getDuration());
                priority.setExpiresAt(LocalDateTime.now().plusDays(2)); // Hết hạn sau 48h
                priority.setPriorityOrder(b.getCreatedAt() != null ? b.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli() : System.currentTimeMillis());
                priority.setStatus(PriorityStatus.ACTIVE);
                bookingPriorityRepository.save(priority);

                createSystemNotification(b.getStudent(), "Lịch hẹn bị hủy đột xuất", 
                    "Mentor " + mentor.getFullname() + " đã hủy lịch hẹn ngày " + b.getBookingDate() + " lúc " + b.getStartTime() + " do bận đột xuất. Bạn được cấp 1 quyền ưu tiên đặt lại lịch bù.");
            }

            // Gọi AI đánh giá bất đồng bộ
            final LocalDateTime finalStartTime = startTime;
            new Thread(() -> {
                try {
                    int leadTimeHours = (int) java.time.Duration.between(LocalDateTime.now(), finalStartTime).toHours();
                    List<AiFeedbackLoop> pastFeedback = aiFeedbackLoopRepository.findTop5ByOrderByCreatedAtDesc();
                    StringBuilder fewShot = new StringBuilder();
                    for (AiFeedbackLoop f : pastFeedback) {
                        fewShot.append("Lý do: ").append(f.getMentorBusy().getReason())
                               .append(" -> AI đề xuất: ").append(f.getAiProposedPenalty())
                               .append("%, Admin điều chỉnh: ").append(f.getAdminActualPenalty())
                               .append("% (Lý do: ").append(f.getAdminAdjustmentReason()).append(")\n");
                    }

                    String aiResult = aiService.evaluateMentorBusyReason(reason, leadTimeHours, fewShot.toString());
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(aiResult);
                    double proposedPenalty = node.path("proposedPenalty").asDouble(0.0);
                    
                    savedBusy.setReliabilityImpact(proposedPenalty);
                    mentorBusyRepository.save(savedBusy);
                } catch (Exception ex) {
                    System.err.println("Lỗi AI đánh giá báo bận: " + ex.getMessage());
                }
            }).start();

            return ResponseEntity.ok(Map.of(
                "message", "Đã báo bận thành công và hủy hàng loạt " + toCancel.size() + " lịch hẹn.",
                "cancelledCount", toCancel.size()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dữ liệu không hợp lệ: " + e.getMessage()));
        }
    }

    /**
     * Khóa giữ chỗ tạm thời (3 phút) cho sinh viên ưu tiên đặt lịch.
     */
    @PostMapping("/lock-slot")
    public ResponseEntity<?> lockSlot(
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        String mentorUsername = (String) payload.get("mentorUsername");
        String dateStr = (String) payload.get("date");
        String startTimeStr = (String) payload.get("startTime");

        if (mentorUsername == null || dateStr == null || startTimeStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng nhập đầy đủ thông tin khóa slot"));
        }

        List<BookingPriority> priorities = bookingPriorityRepository.findByStudentUsernameAndMentorUsernameAndStatusAndExpiresAtAfter(
                principal.getName(), mentorUsername, PriorityStatus.ACTIVE, LocalDateTime.now()
        );

        boolean hasPriority = !priorities.isEmpty();
        if (!hasPriority) {
            // Kiểm tra xem sinh viên có lịch hẹn bị từ chối hoặc hủy gần đây với Mentor này không
            boolean hasRejectedOrCancelled = bookingRepository.findAll().stream()
                .anyMatch(b -> b.getStudent() != null && b.getStudent().getUsername().equalsIgnoreCase(principal.getName())
                        && b.getMentor() != null && b.getMentor().getUsername().equalsIgnoreCase(mentorUsername)
                        && (b.getStatus() == BookingStatus.REJECTED || b.getStatus() == BookingStatus.CANCELLED));
            if (hasRejectedOrCancelled) {
                hasPriority = true;
            }
        }

        String lockKey = mentorUsername + "_" + dateStr + "_" + startTimeStr;
        LocalDateTime now = LocalDateTime.now();
        
        SlotLock existingLock = activeLocks.get(lockKey);
        if (existingLock != null && existingLock.expiresAt.isAfter(now)) {
            if (!existingLock.studentUsername.equalsIgnoreCase(principal.getName())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Khung giờ này đang được chọn giữ chỗ bởi một người dùng khác"));
            }
        }

        activeLocks.put(lockKey, new SlotLock(principal.getName(), now.plusMinutes(3)));

        return ResponseEntity.ok(Map.of(
            "locked", true,
            "expiresAt", now.plusMinutes(3).toString(),
            "message", hasPriority 
                ? "Khung giờ đã được khóa bảo vệ ưu tiên thành công trong 3 phút để bạn thực hiện thao tác đặt lại lịch."
                : "Khung giờ đã được giữ chỗ tạm thời thành công trong 3 phút để bạn thực hiện thao tác đặt lịch."
        ));
    }

    /**
     * Mentor xem danh sách báo bận của chính mình.
     */
    @GetMapping("/mentor/busy")
    public ResponseEntity<?> getMyBusyHistory(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        User mentor = userRepository.findById(principal.getName()).orElse(null);
        if (mentor == null || mentor.getRole() == null || !"MENTOR".equalsIgnoreCase(mentor.getRole().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Quyền truy cập bị từ chối"));
        }

        List<MentorBusy> busyList = mentorBusyRepository.findByMentorUsername(mentor.getUsername());
        // Sắp xếp theo thứ tự mới nhất lên đầu
        busyList.sort((a, b) -> b.getId().compareTo(a.getId()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (MentorBusy mb : busyList) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", mb.getId());
            map.put("startTime", mb.getStartTime().toString());
            map.put("endTime", mb.getEndTime().toString());
            map.put("reason", mb.getReason());
            map.put("reliabilityImpact", mb.getReliabilityImpact());
            map.put("adminApproved", mb.getAdminApproved());
            map.put("createdAt", mb.getCreatedAt() != null ? mb.getCreatedAt().toString() : "");
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Admin xem danh sách báo bận của Mentor để phê duyệt.
     */
    @GetMapping("/admin/busy")
    public ResponseEntity<?> getBusyRequests(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        User admin = userRepository.findById(principal.getName()).orElse(null);
        if (admin == null || admin.getRole() == null || !"ADMIN".equalsIgnoreCase(admin.getRole().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Quyền truy cập bị từ chối"));
        }

        List<MentorBusy> busyList = mentorBusyRepository.findAll();
        // Sắp xếp theo thứ tự mới nhất lên đầu
        busyList.sort((a, b) -> b.getId().compareTo(a.getId()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (MentorBusy mb : busyList) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", mb.getId());
            map.put("mentorUsername", mb.getMentor().getUsername());
            map.put("mentorFullname", mb.getMentor().getFullname());
            map.put("startTime", mb.getStartTime().toString());
            map.put("endTime", mb.getEndTime().toString());
            map.put("reason", mb.getReason());
            map.put("reliabilityImpact", mb.getReliabilityImpact());
            map.put("adminApproved", mb.getAdminApproved());
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Admin phê duyệt / điều chỉnh đợt báo bận và điểm phạt của Mentor.
     */
    @PostMapping("/admin/approve-busy")
    @Transactional
    public ResponseEntity<?> approveBusy(
            @RequestBody Map<String, Object> payload,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        User admin = userRepository.findById(principal.getName()).orElse(null);
        if (admin == null || admin.getRole() == null || !"ADMIN".equalsIgnoreCase(admin.getRole().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Quyền truy cập bị từ chối"));
        }

        Long busyId = Long.parseLong(payload.get("busyId").toString());
        Double actualPenalty = Double.parseDouble(payload.get("actualPenalty").toString());
        String adjustmentReason = (String) payload.get("adjustmentReason");

        MentorBusy busy = mentorBusyRepository.findById(busyId).orElse(null);
        if (busy == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy đợt báo bận"));
        }

        if (!busy.getReliabilityImpact().equals(actualPenalty)) {
            AiFeedbackLoop feedback = new AiFeedbackLoop();
            feedback.setMentorBusy(busy);
            feedback.setAiProposedPenalty(busy.getReliabilityImpact());
            feedback.setAdminActualPenalty(actualPenalty);
            feedback.setAdminAdjustmentReason(adjustmentReason);
            aiFeedbackLoopRepository.save(feedback);
        }

        busy.setReliabilityImpact(actualPenalty);
        busy.setAdminApproved(true);
        mentorBusyRepository.save(busy);

        return ResponseEntity.ok(Map.of("message", "Đã phê duyệt đợt báo bận và áp dụng điểm phạt uy tín thành công."));
    }
}

