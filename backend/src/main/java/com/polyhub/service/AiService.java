package com.polyhub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;

@Slf4j
@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String improveText(String originalText) {
        String prompt = "Hãy sửa lỗi chính tả, làm câu văn mượt mà hơn, chuyên nghiệp hơn và thêm một vài emoji phù hợp cho đoạn văn sau. Trả về trực tiếp nội dung đã sửa, không cần giải thích thêm:\n\n" + originalText;
        return callGemini(createPayload(prompt));
    }

    public String suggestCaption(MultipartFile image) {
        try {
            String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
            String mimeType = image.getContentType();
            String prompt = "Hãy đóng vai là một sinh viên/chuyên gia đầy sáng tạo. Dựa vào tấm ảnh này, hãy viết giúp tôi một dòng trạng thái (caption) thu hút, hài hước hoặc truyền cảm hứng để đăng lên mạng xã hội PolyHUB. Trả về trực tiếp câu caption, kèm theo vài emoji, không cần giải thích gì thêm.";
            return callGemini(createPayloadWithImage(prompt, base64Image, mimeType));
        } catch (Exception e) {
            log.error("Lỗi khi trích xuất ảnh base64: {}", e.getMessage(), e);
            return "Xin lỗi, không thể trích xuất ảnh lúc này. Bạn vui lòng thử lại nhé.";
        }
    }

    public String askAdminCopilot(String question, String contextData) {
        String prompt = "Bạn là Trợ lý Ảo (Admin Copilot) dành riêng cho người quản trị (Admin) của nền tảng kết nối sinh viên và mentor PolyHUB.\n"
                + "Bạn cần trả lời một cách lịch sự, chuyên nghiệp, ngắn gọn và chính xác, xưng hô là 'tôi' và 'sếp' hoặc 'bạn'.\n"
                + "Dưới đây là DỮ LIỆU HỆ THỐNG THỰC TẾ TRONG THỜI GIAN THỰC (Real-time data):\n"
                + "---------------------\n"
                + contextData + "\n"
                + "---------------------\n"
                + "Nếu câu hỏi liên quan đến số liệu, hãy lấy dữ liệu ở trên để trả lời. Nếu câu hỏi không liên quan đến dữ liệu, hãy cố gắng trả lời dựa trên kiến thức của bạn.\n"
                + "Câu hỏi của Admin: " + question;
        return callGemini(createPayload(prompt));
    }

    private String callGemini(ObjectNode payload) {
        String url = geminiApiUrl + "?key=" + geminiApiKey; 
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // headers.set("x-goog-api-key", geminiApiKey); // Dùng query param thay vì header

        HttpEntity<String> request = new HttpEntity<>(payload.toString(), headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                return candidates.get(0).path("content").path("parts").get(0).path("text").asText();
            }
            log.warn("Gemini API trả về thành công nhưng không có nội dung text.");
            return "Không có dữ liệu trả về từ AI.";
            
        } catch (HttpStatusCodeException e) {
            log.error("API Error Status: {}", e.getStatusCode());
            log.error("API Error Response: {}", e.getResponseBodyAsString());
            
            if (e.getStatusCode().is5xxServerError()) {
                return "AI đang được nhiều bạn sử dụng quá nên hơi quá tải một chút. Bạn đợi một lát rồi thử lại nha! ⏳";
            } 
            
            String responseBody = e.getResponseBodyAsString();
            if (e.getStatusCode().value() == 429 || responseBody.contains("RESOURCE_EXHAUSTED") || responseBody.contains("quota")) {
                return "Hệ thống AI đang nhận quá nhiều yêu cầu cùng lúc (vượt quá giới hạn miễn phí). Sếp vui lòng đợi khoảng 1 phút rồi thử lại nhé! ⏳";
            } else if (e.getStatusCode().is4xxClientError()) {
                return "Lỗi kết nối đến AI (Có thể do sai cấu hình hệ thống): " + responseBody;
            }
            return "Lỗi API AI: " + e.getMessage();
            
        } catch (Exception e) {
            log.error("Lỗi hệ thống khi gọi Gemini: {}", e.getMessage(), e);
            return "Đã có lỗi hệ thống xảy ra.";
        }
    }

    private ObjectNode createPayload(String prompt) {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        ObjectNode content = contents.addObject();
        content.put("role", "user");
        ArrayNode parts = content.putArray("parts");
        ObjectNode partText = parts.addObject();
        partText.put("text", prompt);
        return root;
    }

    private ObjectNode createPayloadWithImage(String prompt, String base64Image, String mimeType) {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");
        ObjectNode content = contents.addObject();
        content.put("role", "user");
        ArrayNode parts = content.putArray("parts");
        
        ObjectNode partText = parts.addObject();
        partText.put("text", prompt);
        
        ObjectNode partImage = parts.addObject();
        ObjectNode inlineData = partImage.putObject("inlineData");
        inlineData.put("mimeType", mimeType != null ? mimeType : "image/jpeg");
        inlineData.put("data", base64Image);
        
        return root;
    }
}