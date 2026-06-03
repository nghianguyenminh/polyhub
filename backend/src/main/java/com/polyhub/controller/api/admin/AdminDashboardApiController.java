package com.polyhub.controller.api.admin;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.RequestStatus;
import com.polyhub.entity.User;
import com.polyhub.repository.DocumentRepository;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.repository.PostReportRepository;
import com.polyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardApiController {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final MentorRequestRepository mentorRequestRepository;
    private final PostReportRepository postReportRepository;

    @GetMapping
    public ResponseEntity<?> getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalDocuments = documentRepository.count();
        long pendingMentors = mentorRequestRepository.countByStatus(RequestStatus.PENDING);
        long totalReports = postReportRepository.count();

        List<Object[]> countByCategory = documentRepository.countByCategory();

        // 5 recent mentor requests
        List<MentorRequest> pendingRequests = mentorRequestRepository.findByStatus(
                RequestStatus.PENDING,
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        // Monthly traffic (Optimized database aggregation)
        int currentYear = LocalDate.now().getYear();
        int[] monthlyTraffic = new int[12];
        List<Object[]> monthlyCounts = userRepository.countRegistrationsByMonth(currentYear);
        for (Object[] row : monthlyCounts) {
            if (row[0] != null) {
                int month = ((Number) row[0]).intValue();
                long count = ((Number) row[1]).longValue();
                if (month >= 1 && month <= 12) {
                    monthlyTraffic[month - 1] = (int) count;
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalUsers", totalUsers);
        response.put("totalDocuments", totalDocuments);
        response.put("pendingMentors", pendingMentors);
        response.put("totalReports", totalReports);
        response.put("countByCategory", countByCategory);
        response.put("trafficData", monthlyTraffic);
        
        List<Map<String, Object>> requestsList = pendingRequests.stream().map(req -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", req.getId());
            map.put("fullname", req.getFullname());
            map.put("email", req.getEmail());
            map.put("createdAt", req.getCreatedAt());
            if (req.getUser() != null) {
                map.put("avatar", req.getUser().getAvatar());
            }
            return map;
        }).toList();
        
        response.put("pendingRequests", requestsList);

        return ResponseEntity.ok(response);
    }
}
