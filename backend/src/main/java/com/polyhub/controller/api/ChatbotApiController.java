package com.polyhub.controller.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.polyhub.entity.User;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotApiController {

    private final AiService aiService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> chatWithCopilot(@RequestBody Map<String, String> payload) {
        String message = payload.get("message");
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);

        ObjectNode contextNode = objectMapper.createObjectNode();
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            contextNode.put("Họ và tên", user.getFullname());
            contextNode.put("Tên tài khoản", user.getUsername());
            contextNode.put("Ngành học", user.getMajor() != null ? user.getMajor() : "Chưa cập nhật");
        }

        // Thông tin chung về hệ thống
        contextNode.put("Mô tả hệ thống", "PolyHUB là mạng xã hội học tập dành riêng cho sinh viên FPT Polytechnic. Giúp sinh viên đăng bài, tìm kiếm Mentor, đặt lịch hẹn và xem thư viện tài liệu.");

        // Gọi AI Service
        String aiReply = aiService.askClientCopilot(message, contextNode.toString());

        return ResponseEntity.ok(Map.of("reply", aiReply));
    }
}
