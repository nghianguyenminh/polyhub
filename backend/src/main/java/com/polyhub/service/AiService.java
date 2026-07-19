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

    // ---- Groq (fallback provider khi Gemini hết quota free tier) ----
    @Value("${groq.api.key:}")
    private String groqApiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String improveText(String originalText) {
        String prompt = "Hãy sửa lỗi chính tả, làm câu văn mượt mà hơn, chuyên nghiệp hơn và thêm một vài emoji phù hợp cho đoạn văn sau. Trả về trực tiếp nội dung đã sửa, không cần giải thích thêm:\n\n"
                + originalText;
        return callAiWithFallback(prompt);
    }

    public String suggestCaption(MultipartFile image) {
        // Lưu ý: Groq free tier chưa hỗ trợ tốt vision, nên tính năng có ảnh vẫn chỉ
        // dùng Gemini,
        // không fallback sang Groq (nếu Gemini quá tải thì báo lỗi thân thiện như cũ).
        try {
            String base64Image = Base64.getEncoder().encodeToString(image.getBytes());
            String mimeType = image.getContentType();
            String prompt = "Hãy đóng vai là một sinh viên/chuyên gia đầy sáng tạo. Dựa vào tấm ảnh này, hãy viết giúp tôi một dòng trạng thái (caption) thu hút, hài hước hoặc truyền cảm hứng để đăng lên mạng xã hội PolyHUB. Trả về trực tiếp câu caption, kèm theo vài emoji, không cần giải thích gì thêm.";
            return callGeminiRaw(createPayloadWithImage(prompt, base64Image, mimeType));
        } catch (QuotaExceededException e) {
            return "Hệ thống AI đang nhận quá nhiều yêu cầu cùng lúc (vượt quá giới hạn miễn phí). Bạn vui lòng đợi khoảng 1 phút rồi thử lại nhé! ⏳";
        } catch (AiServiceException e) {
            return e.getMessage();
        } catch (Exception e) {
            log.error("Lỗi khi trích xuất ảnh base64: {}", e.getMessage(), e);
            return "Xin lỗi, không thể trích xuất ảnh lúc này. Bạn vui lòng thử lại nhé.";
        }
    }

    public String askClientCopilot(String question, String contextData) {
        String prompt = "Bạn là Trợ lý Ảo (PolyHUB Copilot) thân thiện, được thiết kế để hỗ trợ sinh viên và người dùng trên nền tảng mạng xã hội học tập PolyHUB.\n"
                + "Bạn cần trả lời một cách lịch sự, tự nhiên và chính xác ngắn gọn đừng quá dài. Xưng hô là 'mình' và 'bạn'.\n"
                + "Dưới đây là DỮ LIỆU NGƯỜI DÙNG HIỆN TẠI VÀ THÔNG TIN HỆ THỐNG:\n"
                + "---------------------\n"
                + contextData + "\n"
                + "---------------------\n"
                + "Hãy dựa vào các thông tin trên (nếu có) để cá nhân hóa câu trả lời. Nếu câu hỏi không liên quan đến dữ liệu, hãy cố gắng trả lời dựa trên kiến thức của bạn.\n"
                + "Câu hỏi của người dùng: " + question;
        return callAiWithFallback(prompt);
    }

    /**
     * Gọi Gemini trước. Nếu Gemini báo hết quota / bị quá tải (429, 5xx) thì tự
     * động
     * chuyển sang Groq (Llama 3.3 70B) để chatbot vẫn trả lời được thay vì "chết".
     * Chỉ dùng cho các tác vụ text-only (improveText, askClientCopilot).
     */
    private String callAiWithFallback(String prompt) {
        boolean hasGemini = geminiApiKey != null && !geminiApiKey.isBlank()
                && !geminiApiKey.contains("your-gemini-api-key");
        boolean hasGroq = groqApiKey != null && !groqApiKey.isBlank();

        // Nếu người dùng đã xóa/không cấu hình Gemini Key nhưng có Groq Key -> Dùng
        // luôn Groq
        if (!hasGemini && hasGroq) {
            log.info("Gemini API Key không hợp lệ hoặc chưa cấu hình. Chuyển sang sử dụng Groq trực tiếp.");
            try {
                return callGroq(prompt);
            } catch (Exception groqEx) {
                log.error("Groq lỗi: {}", groqEx.getMessage(), groqEx);
                return "Hệ thống AI đang gặp sự cố. Bạn vui lòng thử lại sau ít phút nhé! ⏳";
            }
        }

        try {
            return callGeminiRaw(createPayload(prompt));
        } catch (QuotaExceededException e) {
            log.warn("Gemini không khả dụng (Lỗi/Quá tải), thử fallback sang Groq...", e.getMessage());
            if (!hasGroq) {
                return "Hệ thống AI đang quá tải và chưa cấu hình provider dự phòng (Groq). Bạn vui lòng đợi một lát rồi thử lại nhé! ⏳";
            }
            try {
                return callGroq(prompt);
            } catch (Exception groqEx) {
                log.error("Groq fallback cũng lỗi: {}", groqEx.getMessage(), groqEx);
                return "Cả Gemini và Groq đều đang gặp sự cố. Bạn vui lòng thử lại sau ít phút nhé! ⏳";
            }
        } catch (AiServiceException e) {
            return e.getMessage();
        }
    }

    /**
     * Gọi Gemini và ném exception (thay vì trả về chuỗi lỗi) để callAiWithFallback
     * có thể phân biệt lỗi "hết quota -> nên fallback" và các lỗi khác.
     */
    private String callGeminiRaw(ObjectNode payload) {
        String url = geminiApiUrl + "?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>(payload.toString(), headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                return candidates.get(0).path("content").path("parts").get(0).path("text").asText();
            }
            log.warn("Gemini API trả về thành công nhưng không có nội dung text.");
            throw new AiServiceException("Không có dữ liệu trả về từ AI.");

        } catch (HttpStatusCodeException e) {
            log.error("Gemini API Error Status: {}", e.getStatusCode());
            log.error("Gemini API Error Response: {}", e.getResponseBodyAsString());

            String responseBody = e.getResponseBodyAsString();
            boolean isQuotaError = e.getStatusCode().value() == 429
                    || responseBody.contains("RESOURCE_EXHAUSTED")
                    || responseBody.contains("quota");

            if (isQuotaError) {
                throw new QuotaExceededException("Gemini hết quota free tier (429).");
            }
            if (e.getStatusCode().is5xxServerError()) {
                // Coi lỗi 5xx (quá tải server Google) cũng là trường hợp nên thử fallback
                throw new QuotaExceededException("Gemini quá tải (5xx).");
            }
            if (e.getStatusCode().is4xxClientError()) {
                // Ném QuotaExceededException để kích hoạt fallback sang Groq nếu lỗi là do API
                // Key
                if (responseBody.contains("API key not valid")) {
                    throw new QuotaExceededException("Gemini sai API Key, chuyển sang Groq.");
                }
                throw new AiServiceException("Lỗi kết nối đến AI (Có thể do sai cấu hình hệ thống): " + responseBody);
            }
            throw new AiServiceException("Lỗi API AI: " + e.getMessage());

        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi hệ thống khi gọi Gemini: {}", e.getMessage(), e);
            throw new AiServiceException("Đã có lỗi hệ thống xảy ra.");
        }
    }

    public String evaluateMentorBusyReason(String reason, int leadTimeHours, String fewShotExamples) {
        String prompt = "Hãy phân tích lý do báo bận đột xuất của Mentor sau và đề xuất mức phạt điểm uy tín (từ 0% đến 10%).\n"
                + "- Lý do báo bận: " + reason + "\n"
                + "- Thời gian báo trước (Lead Time): " + leadTimeHours + " giờ.\n\n"
                + "Quy tắc đánh giá:\n"
                + "1. Nếu Mentor báo trước từ 24 - 48 giờ trở lên (ví dụ: xin nghỉ đi du lịch, có kế hoạch trước): Đây là hành vi hợp lệ, phạt 0%.\n"
                + "2. Nếu Mentor báo bận sát giờ (Lead Time < 24 giờ) nhưng có lý do khẩn cấp chính đáng bất khả kháng (ốm đau đột xuất có minh chứng, tai nạn, việc gia đình khẩn cấp): Châm chước phạt rất nhẹ (từ 0% đến 2%).\n"
                + "3. Nếu báo bận sát giờ với lý do không chính đáng (quên lịch, bận việc riêng thông thường, trùng lịch cá nhân không khẩn cấp): Phạt nặng (từ 5% đến 10%).\n\n"
                + "Dưới đây là một số ví dụ thực tế mà người quản trị (Admin) đã từng phê duyệt/điều chỉnh để tham khảo:\n"
                + "---------------------\n"
                + (fewShotExamples.isEmpty() ? "(Không có ví dụ cũ)" : fewShotExamples) + "\n"
                + "---------------------\n\n"
                + "Yêu cầu trả về định dạng JSON nguyên bản chứa chính xác các trường sau, không trả thêm bất kỳ câu giải thích nào:\n"
                + "{\n"
                + "  \"validScore\": 80,\n"
                + "  \"proposedPenalty\": 2.0,\n"
                + "  \"reasoning\": \"[giải thích lý do]\"\n"
                + "}";
        return callGeminiRaw(createPayload(prompt));
    }

    /**
     * Fallback provider: Groq (OpenAI-compatible endpoint), model mặc định Llama
     * 3.3 70B.
     * Free tier của Groq khá rộng rãi và tốc độ rất nhanh, phù hợp làm phương án dự
     * phòng.
     */
    private String callGroq(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", groqModel);
        payload.put("temperature", 0.7);
        ArrayNode messages = payload.putArray("messages");
        ObjectNode userMessage = messages.addObject();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);

        HttpEntity<String> request = new HttpEntity<>(payload.toString(), headers);

        ResponseEntity<String> response = restTemplate.postForEntity(groqApiUrl, request, String.class);
        JsonNode root;
        try {
            root = objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new AiServiceException("Không đọc được phản hồi từ Groq.");
        }

        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            return choices.get(0).path("message").path("content").asText();
        }

        throw new AiServiceException("Groq không trả về nội dung.");
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

    // ---- Custom exceptions dùng nội bộ để quyết định có fallback sang Groq hay
    // không ----

    private static class AiServiceException extends RuntimeException {
        public AiServiceException(String message) {
            super(message);
        }
    }

    private static class QuotaExceededException extends AiServiceException {
        public QuotaExceededException(String message) {
            super(message);
        }
    }
}