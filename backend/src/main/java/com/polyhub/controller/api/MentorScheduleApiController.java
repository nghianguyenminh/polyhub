package com.polyhub.controller.api;

import com.polyhub.entity.MentorSchedule;
import com.polyhub.entity.User;
import com.polyhub.repository.MentorScheduleRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/mentor/schedule")
public class MentorScheduleApiController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorScheduleRepository mentorScheduleRepository;

    @GetMapping
    public ResponseEntity<?> getSchedule(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user == null || user.getRole() == null || !"MENTOR".equalsIgnoreCase(user.getRole().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Chỉ Mentor mới có quyền truy cập"));
        }

        List<MentorSchedule> schedules = mentorScheduleRepository.findByMentorUsername(user.getUsername());
        return ResponseEntity.ok(schedules);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> saveSchedule(@RequestBody List<Map<String, Object>> slots, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user == null || user.getRole() == null || !"MENTOR".equalsIgnoreCase(user.getRole().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Chỉ Mentor mới có quyền truy cập"));
        }

        List<MentorSchedule> newSchedules = new ArrayList<>();

        try {
            for (Map<String, Object> slot : slots) {
                java.time.LocalDate specificDate = null;
                if (slot.get("specificDate") != null && !slot.get("specificDate").toString().trim().isEmpty()) {
                    specificDate = java.time.LocalDate.parse(slot.get("specificDate").toString());
                }

                java.time.LocalDate expireDate = null;
                if (slot.get("expireDate") != null && !slot.get("expireDate").toString().trim().isEmpty()) {
                    expireDate = java.time.LocalDate.parse(slot.get("expireDate").toString());
                }

                Integer dayOfWeek = null;
                if (specificDate != null) {
                    dayOfWeek = specificDate.getDayOfWeek().getValue() + 1;
                } else {
                    dayOfWeek = Integer.parseInt(slot.get("dayOfWeek").toString());
                    if (dayOfWeek < 2 || dayOfWeek > 8) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Ngày trong tuần phải từ 2 (Thứ 2) đến 8 (Chủ nhật)"));
                    }
                }

                LocalTime startTime = LocalTime.parse(slot.get("startTime").toString());
                LocalTime endTime = LocalTime.parse(slot.get("endTime").toString());

                if (!startTime.isBefore(endTime)) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Thời gian bắt đầu phải trước thời gian kết thúc"));
                }

                MentorSchedule schedule = new MentorSchedule();
                schedule.setMentor(user);
                schedule.setDayOfWeek(dayOfWeek);
                schedule.setStartTime(startTime);
                schedule.setEndTime(endTime);
                schedule.setSpecificDate(specificDate);
                schedule.setExpireDate(expireDate);
                newSchedules.add(schedule);
            }

            // Kiểm tra trùng lặp đè lên nhau giữa các khung giờ rảnh
            for (int i = 0; i < newSchedules.size(); i++) {
                MentorSchedule s1 = newSchedules.get(i);
                for (int j = i + 1; j < newSchedules.size(); j++) {
                    MentorSchedule s2 = newSchedules.get(j);
                    
                    // Kiểm tra xem có giao nhau về mặt ngày/lịch không
                    boolean dateOverlap = false;
                    if (s1.getSpecificDate() != null && s2.getSpecificDate() != null) {
                        dateOverlap = s1.getSpecificDate().equals(s2.getSpecificDate());
                    } else if (s1.getSpecificDate() == null && s2.getSpecificDate() == null) {
                        dateOverlap = s1.getDayOfWeek().equals(s2.getDayOfWeek());
                    } else {
                        // Một bên cụ thể, một bên lặp lại
                        MentorSchedule spec = s1.getSpecificDate() != null ? s1 : s2;
                        MentorSchedule rec = s1.getSpecificDate() == null ? s1 : s2;
                        if (spec.getDayOfWeek().equals(rec.getDayOfWeek())) {
                            if (rec.getExpireDate() == null || !spec.getSpecificDate().isAfter(rec.getExpireDate())) {
                                dateOverlap = true;
                            }
                        }
                    }

                    if (dateOverlap) {
                        if (s1.getStartTime().isBefore(s2.getEndTime()) && s1.getEndTime().isAfter(s2.getStartTime())) {
                            String dateDesc1 = s1.getSpecificDate() != null ? s1.getSpecificDate().toString() : "Thứ " + (s1.getDayOfWeek() == 8 ? "nhật" : s1.getDayOfWeek());
                            String dateDesc2 = s2.getSpecificDate() != null ? s2.getSpecificDate().toString() : "Thứ " + (s2.getDayOfWeek() == 8 ? "nhật" : s2.getDayOfWeek());
                            return ResponseEntity.badRequest().body(Map.of("error", 
                                    "Khung giờ cấu hình của bạn bị trùng lặp: " + 
                                    dateDesc1 + " " + s1.getStartTime() + "-" + s1.getEndTime() + 
                                    " đè lên " + dateDesc2 + " " + s2.getStartTime() + "-" + s2.getEndTime()));
                        }
                    }
                }
            }

            // Xóa hết schedule cũ của mentor này và lưu cái mới
            mentorScheduleRepository.deleteByMentor(user);
            mentorScheduleRepository.saveAll(newSchedules);

            return ResponseEntity.ok(Map.of("message", "Cập nhật lịch rảnh thành công!"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Dữ liệu không hợp lệ: " + e.getMessage()));
        }
    }
}
