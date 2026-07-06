package com.polyhub.controller.api.admin;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.Notification;
import com.polyhub.entity.RequestStatus;
import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.repository.NotificationRepository;
import com.polyhub.repository.RoleRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/mentors")
@RequiredArgsConstructor
@Transactional
public class AdminMentorApiController {

    private final MentorRequestRepository mentorRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;
    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getMentorRequests(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue="ALL") String status,
            @RequestParam(required = false) String keyword) { // ĐIỂM SỬA 1: Bổ sung tham số keyword
        
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<MentorRequest> reqPage;

        // ĐIỂM SỬA 2: Kiểm tra xem có từ khóa được gửi lên không
        boolean hasKeyword = keyword != null && !keyword.trim().isEmpty();

        if ("ALL".equalsIgnoreCase(status)) {
            if (hasKeyword) {
                // Có từ khóa + Tất cả trạng thái
                reqPage = mentorRequestRepository.searchAllByKeyword(keyword, pageable);
            } else {
                // Không có từ khóa + Tất cả trạng thái
                reqPage = mentorRequestRepository.findAll(pageable);
            }
        } else {
            try {
                RequestStatus reqStatus = RequestStatus.valueOf(status.toUpperCase());
                if (hasKeyword) {
                    // Có từ khóa + Trạng thái cụ thể
                    reqPage = mentorRequestRepository.findByStatusAndKeyword(reqStatus, keyword, pageable);
                } else {
                    // Không có từ khóa + Trạng thái cụ thể
                    reqPage = mentorRequestRepository.findByStatus(reqStatus, pageable);
                }
            } catch (IllegalArgumentException e) {
                reqPage = mentorRequestRepository.findAll(pageable);
            }
        }
        
        long pendingCount = mentorRequestRepository.countByStatus(RequestStatus.PENDING);
        long approvedCount = mentorRequestRepository.countByStatus(RequestStatus.APPROVED);
        long rejectedCount = mentorRequestRepository.countByStatus(RequestStatus.REJECTED);
        
        Map<String, Object> response = new HashMap<>();
        response.put("requests", reqPage.getContent());
        response.put("currentPage", page);
        response.put("totalPages", reqPage.getTotalPages());
        response.put("currentStatus", status);
        
        // ĐIỂM SỬA 3: Trả về keyword cho Frontend
        response.put("currentKeyword", keyword); 
        
        response.put("pendingCount", pendingCount);
        response.put("approvedCount", approvedCount);
        response.put("rejectedCount", rejectedCount);

        return ResponseEntity.ok(response);
    }
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveMentor(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String adminNotes = body != null ? body.get("adminNotes") : null;
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && (request.getStatus() == RequestStatus.PENDING || request.getStatus() == RequestStatus.INTERVIEWING)) {
            request.setStatus(RequestStatus.APPROVED);
            if (adminNotes != null) request.setAdminNotes(adminNotes);
            mentorRequestRepository.save(request);

            User user = request.getUser();
            if (user != null) {
                Role role = roleRepository.findById("MENTOR").orElse(null);
                if (role == null) {
                    role = new Role("MENTOR", "Giảng viên / Mentor");
                    roleRepository.save(role);
                }
                user.setRole(role);
                userRepository.save(user); 
            }

            emailService.sendMentorApprovalEmail(request.getEmail(), request.getFullname());

            // Gửi thông báo in-app
            if (user != null) {
                Notification notif = new Notification();
                notif.setUser(user);
                notif.setTitle("Phê duyệt hồ sơ Mentor");
                notif.setContent("Chúc mừng! Yêu cầu trở thành Mentor của bạn đã được ban quản trị phê duyệt.");
                notif.setLink("/mentors");
                notificationRepository.save(notif);
            }

            return ResponseEntity.ok(Map.of("message", "Đã phê duyệt yêu cầu trở thành Mentor."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Không thể phê duyệt yêu cầu này."));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectMentor(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && (request.getStatus() == RequestStatus.PENDING || request.getStatus() == RequestStatus.INTERVIEWING || request.getStatus() == RequestStatus.NEEDS_UPDATE)) {
            request.setStatus(RequestStatus.REJECTED);
            request.setRejectionReason(reason);
            mentorRequestRepository.save(request);

            emailService.sendMentorRejectionEmail(request.getEmail(), request.getFullname(), reason);

            // Gửi thông báo in-app
            User user = request.getUser();
            if (user != null) {
                Notification notif = new Notification();
                notif.setUser(user);
                notif.setTitle("Từ chối hồ sơ Mentor");
                notif.setContent("Rất tiếc, yêu cầu Mentor của bạn đã bị từ chối với lý do: " + reason);
                notif.setLink("/mentors/register");
                notificationRepository.save(notif);
            }

            return ResponseEntity.ok(Map.of("message", "Đã từ chối yêu cầu trở thành Mentor."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Không thể từ chối yêu cầu này."));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN')")
    @PostMapping("/{id}/revoke")
    public ResponseEntity<?> revokeMentor(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && request.getStatus() == RequestStatus.APPROVED) {
            request.setStatus(RequestStatus.REVOKED);
            request.setRejectionReason(reason);
            mentorRequestRepository.save(request);

            User user = request.getUser();
            if (user != null) {
                Role role = roleRepository.findById("USER").orElse(null);
                if (role != null) {
                    user.setRole(role);
                    userRepository.save(user); 
                }
            }

            emailService.sendMentorRevokeEmail(request.getEmail(), request.getFullname(), reason);

            // Gửi thông báo in-app
            if (user != null) {
                Notification notif = new Notification();
                notif.setUser(user);
                notif.setTitle("Tước quyền Mentor");
                notif.setContent("Tài khoản của bạn đã bị tước quyền Mentor và chuyển về vai trò Học viên với lý do: " + reason);
                notif.setLink("/");
                notificationRepository.save(notif);
            }

            return ResponseEntity.ok(Map.of("message", "Đã tước quyền Mentor và đưa tài khoản về vai trò Sinh viên."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Không thể tước quyền yêu cầu này."));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN')")
    @PostMapping("/{id}/request-update")
    public ResponseEntity<?> requestUpdateMentor(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && request.getStatus() == RequestStatus.PENDING) {
            request.setStatus(RequestStatus.NEEDS_UPDATE);
            request.setAdminNotes(reason);
            mentorRequestRepository.save(request);

            emailService.sendMentorUpdateEmail(request.getEmail(), request.getFullname(), reason);

            User user = request.getUser();
            if (user != null) {
                Notification notif = new Notification();
                notif.setUser(user);
                notif.setTitle("Yêu cầu bổ sung hồ sơ Mentor");
                notif.setContent("Hồ sơ Mentor của bạn cần bổ sung thêm thông tin. Vui lòng kiểm tra email và cập nhật lại hồ sơ.");
                notif.setLink("/mentors/register");
                notificationRepository.save(notif);
            }

            return ResponseEntity.ok(Map.of("message", "Đã gửi yêu cầu bổ sung hồ sơ đến người dùng."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Không thể thực hiện thao tác này."));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN')")
    @PostMapping("/{id}/interview")
    public ResponseEntity<?> interviewMentor(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String notes = body.get("reason");
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && request.getStatus() == RequestStatus.PENDING) {
            request.setStatus(RequestStatus.INTERVIEWING);
            request.setAdminNotes(notes);
            mentorRequestRepository.save(request);

            emailService.sendMentorInterviewEmail(request.getEmail(), request.getFullname(), notes);

            User user = request.getUser();
            if (user != null) {
                Notification notif = new Notification();
                notif.setUser(user);
                notif.setTitle("Thư mời phỏng vấn Mentor");
                notif.setContent("Hồ sơ của bạn đã qua vòng sơ loại. Ban quản trị đã gửi thư mời phỏng vấn, vui lòng kiểm tra email.");
                notif.setLink("/mentors");
                notificationRepository.save(notif);
            }

            return ResponseEntity.ok(Map.of("message", "Đã chuyển hồ sơ sang vòng phỏng vấn và gửi email thông báo."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Không thể thực hiện thao tác này."));
    }
}
