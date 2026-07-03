package com.polyhub.controller.api.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.polyhub.entity.DocumentStatus;
import com.polyhub.entity.RequestStatus;
import com.polyhub.repository.DocumentRepository;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/chatbot")
@RequiredArgsConstructor
public class AdminChatbotApiController {

    private final AiService aiService;
    private final UserRepository userRepository;
    private final MentorRequestRepository mentorRequestRepository;
    private final DocumentRepository documentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> chatWithAdmin(@RequestBody Map<String, String> payload) {
        String message = payload.get("message");
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }

        // 1. Thu thập dữ liệu thống kê realtime
        long totalUsers = userRepository.count();
        long pendingMentors = mentorRequestRepository.countByStatus(RequestStatus.PENDING);
        long pendingDocuments = documentRepository.countByStatus(DocumentStatus.PENDING);
        long totalDocuments = documentRepository.count();

        // Đóng gói thành JSON String để AI dễ đọc
        ObjectNode contextNode = objectMapper.createObjectNode();
        contextNode.put("Tổng số User đăng ký hệ thống", totalUsers);
        contextNode.put("Số lượng Mentor đang chờ duyệt", pendingMentors);
        contextNode.put("Tổng số Tài liệu chia sẻ", totalDocuments);
        contextNode.put("Số lượng Tài liệu đang chờ duyệt", pendingDocuments);

        // 2. Gửi cho Gemini
        String aiReply = aiService.askAdminCopilot(message, contextNode.toString());

        // 3. Trả về kết quả
        return ResponseEntity.ok(Map.of("reply", aiReply));
    }
}
