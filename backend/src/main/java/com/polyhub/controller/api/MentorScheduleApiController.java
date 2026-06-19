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
                Integer dayOfWeek = Integer.parseInt(slot.get("dayOfWeek").toString());
                if (dayOfWeek < 2 || dayOfWeek > 8) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Ngày trong tuần phải từ 2 (Thứ 2) đến 8 (Chủ nhật)"));
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
                newSchedules.add(schedule);
            }

            // Kiểm tra trùng lặp đè lên nhau giữa các khung giờ rảnh trong cùng 1 ngày của cấu hình gửi lên
            for (int i = 0; i < newSchedules.size(); i++) {
                MentorSchedule s1 = newSchedules.get(i);
                for (int j = i + 1; j < newSchedules.size(); j++) {
                    MentorSchedule s2 = newSchedules.get(j);
                    if (s1.getDayOfWeek().equals(s2.getDayOfWeek())) {
                        if (s1.getStartTime().isBefore(s2.getEndTime()) && s1.getEndTime().isAfter(s2.getStartTime())) {
                            return ResponseEntity.badRequest().body(Map.of("error", 
                                    "Khung giờ cấu hình của bạn bị trùng lặp: Thứ " + 
                                    (s1.getDayOfWeek() == 8 ? "nhật" : s1.getDayOfWeek()) + " " + 
                                    s1.getStartTime() + "-" + s1.getEndTime() + " đè lên " + 
                                    s2.getStartTime() + "-" + s2.getEndTime()));
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
