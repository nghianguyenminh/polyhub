package com.polyhub.controller.api.admin;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.RequestStatus;
import com.polyhub.entity.Role;
import com.polyhub.entity.User;
import com.polyhub.repository.MentorRequestRepository;
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
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/mentors")
@RequiredArgsConstructor
public class AdminMentorApiController {

    private final MentorRequestRepository mentorRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;

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
    public ResponseEntity<?> approveMentor(@PathVariable Long id) {
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && request.getStatus() == RequestStatus.PENDING) {
            request.setStatus(RequestStatus.APPROVED);
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
            return ResponseEntity.ok(Map.of("message", "Đã phê duyệt yêu cầu trở thành Mentor."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Không thể phê duyệt yêu cầu này."));
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER_ADMIN')")
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectMentor(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reason = body.get("reason");
        MentorRequest request = mentorRequestRepository.findById(id).orElse(null);
        if (request != null && request.getStatus() == RequestStatus.PENDING) {
            request.setStatus(RequestStatus.REJECTED);
            request.setRejectionReason(reason);
            mentorRequestRepository.save(request);

            emailService.sendMentorRejectionEmail(request.getEmail(), request.getFullname(), reason);
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
            return ResponseEntity.ok(Map.of("message", "Đã tước quyền Mentor và đưa tài khoản về vai trò Sinh viên."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Không thể tước quyền yêu cầu này."));
    }
}
