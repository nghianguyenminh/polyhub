package com.polyhub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Dịch vụ eKYC (OCR CCCD + Liveness/FaceMatch) cho PolyHUB.
 *
 * LƯU Ý QUAN TRỌNG:
 * FPT.AI Console (api.fpt.ai) đã ngừng cấp API key mới từ 06/07/2026 và ngừng
 * hoạt động hoàn toàn với gói cá nhân từ 29/08/2026 (xem thông báo chính thức
 * của FPT.AI). Vì vậy service này đã được viết lại để dùng FPT AI Marketplace
 * (mkp-api.fptcloud.com) với model vision-language Qwen2.5-VL-7B-Instruct qua
 * endpoint /chat/completions, thay cho các API OCR/Liveness/FaceMatch chuyên
 * biệt cũ đã bị khai tử.
 *
 * Do Qwen2.5-VL là model tổng quát (không chuyên biệt cho chống giả mạo sinh
 * trắc học như Liveness V3 cũ), độ chính xác chống giả mạo/deepfake sẽ thấp
 * hơn giải pháp cũ. Đây là đánh đổi chấp nhận được cho mục đích demo đồ án.
 */
@Service
public class FptAiService {

    @Value("${fpt.ai.marketplace.api-key:mock}")
    private String apiKey;

    @Value("${fpt.ai.marketplace.url:https://mkp-api.fptcloud.com/chat/completions}")
    private String marketplaceUrl;

    @Value("${fpt.ai.marketplace.model:Qwen2.5-VL-7B-Instruct}")
    private String model;

    // Số khung hình trích từ video liveness để gửi cho model phân tích
    private static final int LIVENESS_FRAME_COUNT = 3;

    private boolean isMockMode() {
        return apiKey == null || apiKey.trim().isEmpty() || "mock".equalsIgnoreCase(apiKey.trim());
    }

    // ────────────────────────────────────────────────────────────────
    // 1) OCR trích xuất thông tin CCCD/CMND
    // ────────────────────────────────────────────────────────────────
    public JsonNode extractCccdDetails(MultipartFile imageFile) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        if (isMockMode()) {
            System.out.println("Using MOCK eKYC OCR verification. Skipping actual API call.");
            ObjectNode mockResult = mapper.createObjectNode();
            mockResult.put("errorCode", 0);
            mockResult.put("errorMessage", "success");

            ObjectNode mockData = mapper.createObjectNode();
            mockData.put("id", "079099012345");
            mockData.put("name", "PHAN TRAN TIEN");
            mockData.put("dob", "15/08/1999");
            mockData.put("sex", "NAM");
            mockData.put("copy_check", "real");
            mockData.put("fake_check", "real");
            mockData.put("recaptured_check", "real");
            mockData.put("type", "front");

            mockResult.putArray("data").add(mockData);
            return mockResult;
        }

        String prompt =
            "Bạn là hệ thống OCR chuyên trích xuất thông tin từ ảnh Căn cước công dân (CCCD) Việt Nam. Ảnh có thể là MẶT TRƯỚC " +
            "(có ảnh chân dung, quốc huy, số CCCD, họ tên, ngày sinh) hoặc MẶT SAU (có vân tay, mã QR, đặc điểm nhận dạng, ngày cấp).\n" +
            "Hãy phân tích kỹ ảnh được cung cấp và trả về DUY NHẤT một đối tượng JSON hợp lệ theo ĐÚNG cấu trúc dưới đây, " +
            "KHÔNG thêm bất kỳ văn bản giải thích, KHÔNG dùng markdown code fence (```), chỉ trả JSON thuần:\n" +
            "{\n" +
            "  \"errorCode\": 0,\n" +
            "  \"errorMessage\": \"success\",\n" +
            "  \"data\": [\n" +
            "    {\n" +
            "      \"type\": \"<'front' nếu đây là mặt trước thẻ (có ảnh chân dung), 'back' nếu đây là mặt sau thẻ (có vân tay/mã QR)>\",\n" +
            "      \"id\": \"<số CCCD 12 chữ số, để rỗng nếu là mặt sau và không đọc được>\",\n" +
            "      \"name\": \"<họ và tên viết IN HOA, giữ nguyên dấu tiếng Việt, để rỗng nếu là mặt sau>\",\n" +
            "      \"dob\": \"<ngày sinh định dạng DD/MM/YYYY, để rỗng nếu là mặt sau>\",\n" +
            "      \"sex\": \"<NAM hoặc NỮ, để rỗng nếu là mặt sau>\",\n" +
            "      \"copy_check\": \"<'real' nếu là ảnh thẻ gốc, 'photo' nếu phát hiện đây là ảnh chụp lại bản photocopy>\",\n" +
            "      \"fake_check\": \"<'real' nếu thẻ hợp lệ, 'fake' nếu phát hiện dấu hiệu thẻ giả mạo/chỉnh sửa>\",\n" +
            "      \"recaptured_check\": \"<'real' nếu ảnh chụp trực tiếp, 'screen_recaptured' nếu phát hiện ảnh được chụp lại từ màn hình khác>\"\n" +
            "    }\n" +
            "  ]\n" +
            "}\n" +
            "Nếu KHÔNG tìm thấy thẻ CCCD hợp lệ nào trong ảnh, trả về: " +
            "{\"errorCode\": 5, \"errorMessage\": \"Không tìm thấy thẻ CCCD hoặc khuôn mặt trong ảnh\", \"data\": []}";

        String mimeType = detectImageMimeType(imageFile.getOriginalFilename());
        JsonNode result = callMarketplaceVision(prompt, List.of(imageFile.getBytes()), List.of(mimeType));

        // Đảm bảo response luôn có shape tối thiểu để downstream code không NPE
        if (!result.has("errorCode")) {
            ObjectNode fallback = mapper.createObjectNode();
            fallback.put("errorCode", 5);
            fallback.put("errorMessage", "Không thể phân tích kết quả từ model OCR");
            fallback.putArray("data");
            return fallback;
        }
        return result;
    }

    // ────────────────────────────────────────────────────────────────
    // 2) Liveness + FaceMatch: trích khung hình từ video rồi so khớp với ảnh CCCD
    // ────────────────────────────────────────────────────────────────
    public JsonNode verifyLivenessAndFaceMatch(MultipartFile videoFile, MultipartFile cccdFile) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        if (isMockMode()) {
            System.out.println("Using MOCK eKYC Liveness verification. Skipping actual API call.");
            ObjectNode mockResult = mapper.createObjectNode();
            mockResult.put("code", "200");
            mockResult.put("message", "Success");

            ObjectNode mockData = mapper.createObjectNode();
            ObjectNode mockLiveness = mapper.createObjectNode();
            mockLiveness.put("is_live", true);
            mockLiveness.put("deep_fake", false);
            mockData.set("liveness", mockLiveness);

            ObjectNode mockFaceMatch = mapper.createObjectNode();
            mockFaceMatch.put("is_match", true);
            mockFaceMatch.put("similarity", 98.5);
            mockData.set("face_match", mockFaceMatch);

            mockResult.set("data", mockData);
            return mockResult;
        }

        String videoFilename = videoFile.getOriginalFilename();
        String extension = (videoFilename != null && videoFilename.toLowerCase().endsWith(".mp4")) ? "mp4" : "webm";

        List<byte[]> frames;
        try {
            frames = extractFramesFromVideo(videoFile.getBytes(), extension, LIVENESS_FRAME_COUNT);
        } catch (Exception e) {
            throw new Exception("Không thể trích xuất khung hình từ video (kiểm tra ffmpeg đã cài trên server chưa): " + e.getMessage());
        }

        List<byte[]> images = new ArrayList<>(frames);
        images.add(cccdFile.getBytes());

        List<String> mimeTypes = new ArrayList<>();
        for (int i = 0; i < frames.size(); i++) {
            mimeTypes.add("image/jpeg"); // ffmpeg xuất frame dạng jpg
        }
        mimeTypes.add(detectImageMimeType(cccdFile.getOriginalFilename()));

        String prompt =
            "Bạn nhận được " + frames.size() + " ảnh đầu tiên là các khung hình liên tiếp trích từ MỘT video quay " +
            "trực tiếp khuôn mặt người dùng (theo đúng thứ tự thời gian), và ảnh CUỐI CÙNG là ảnh mặt trên thẻ CCCD của người đó.\n\n" +
            "Nhiệm vụ của bạn gồm 2 phần:\n" +
            "1) LIVENESS: Dựa trên sự khác biệt tự nhiên giữa các khung hình video (góc mặt, biểu cảm, ánh sáng, chuyển động), " +
            "hãy nhận định đây có phải một người thật đang quay video trực tiếp hay không. Nếu các khung hình giống hệt nhau bất " +
            "thường, có viền/khung màn hình, có dấu hiệu là ảnh tĩnh được quay lại, hoặc có dấu hiệu deepfake (méo mó, không tự nhiên " +
            "quanh mắt/miệng), hãy đánh giá is_live = false.\n" +
            "2) FACE MATCH: So sánh khuôn mặt trong các khung hình video với khuôn mặt trên ảnh CCCD, đánh giá có phải cùng một người " +
            "hay không và ước lượng phần trăm độ tương đồng (0-100).\n\n" +
            "Trả về DUY NHẤT một đối tượng JSON hợp lệ theo ĐÚNG cấu trúc sau, KHÔNG thêm giải thích, KHÔNG dùng markdown code fence:\n" +
            "{\n" +
            "  \"code\": \"200\",\n" +
            "  \"message\": \"Success\",\n" +
            "  \"data\": {\n" +
            "    \"liveness\": { \"is_live\": true hoặc false, \"deep_fake\": true hoặc false },\n" +
            "    \"face_match\": { \"is_match\": true hoặc false, \"similarity\": <số thực từ 0 đến 100> }\n" +
            "  }\n" +
            "}";

        JsonNode result = callMarketplaceVision(prompt, images, mimeTypes);

        if (!result.has("data")) {
            ObjectNode fallback = mapper.createObjectNode();
            fallback.put("code", "500");
            fallback.put("message", "Không thể phân tích kết quả từ model Liveness/FaceMatch");
            ObjectNode fallbackData = mapper.createObjectNode();
            ObjectNode fallbackLiveness = mapper.createObjectNode();
            fallbackLiveness.put("is_live", false);
            fallbackLiveness.put("deep_fake", false);
            fallbackData.set("liveness", fallbackLiveness);
            ObjectNode fallbackFaceMatch = mapper.createObjectNode();
            fallbackFaceMatch.put("is_match", false);
            fallbackFaceMatch.put("similarity", 0);
            fallbackData.set("face_match", fallbackFaceMatch);
            fallback.set("data", fallbackData);
            return fallback;
        }
        return result;
    }

    // ────────────────────────────────────────────────────────────────
    // Helper: gọi FPT AI Marketplace (chat/completions, OpenAI-compatible schema)
    // ────────────────────────────────────────────────────────────────
    private JsonNode callMarketplaceVision(String promptText, List<byte[]> images, List<String> mimeTypes) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        ArrayNode contentArray = mapper.createArrayNode();
        ObjectNode textPart = mapper.createObjectNode();
        textPart.put("type", "text");
        textPart.put("text", promptText);
        contentArray.add(textPart);

        for (int i = 0; i < images.size(); i++) {
            String base64Image = Base64.getEncoder().encodeToString(images.get(i));
            String mime = mimeTypes.get(i);

            ObjectNode imagePart = mapper.createObjectNode();
            imagePart.put("type", "image_url");
            ObjectNode imageUrlNode = mapper.createObjectNode();
            imageUrlNode.put("url", "data:" + mime + ";base64," + base64Image);
            imagePart.set("image_url", imageUrlNode);
            contentArray.add(imagePart);
        }

        ObjectNode userMessage = mapper.createObjectNode();
        userMessage.put("role", "user");
        userMessage.set("content", contentArray);

        ArrayNode messages = mapper.createArrayNode();
        messages.add(userMessage);

        ObjectNode requestBody = mapper.createObjectNode();
        requestBody.put("model", model);
        requestBody.set("messages", messages);
        requestBody.put("temperature", 0.1);
        requestBody.put("max_tokens", 800);

        HttpEntity<String> requestEntity = new HttpEntity<>(mapper.writeValueAsString(requestBody), headers);

        ResponseEntity<String> response;
        try {
            response = restTemplate.postForEntity(marketplaceUrl, requestEntity, String.class);
        } catch (Exception e) {
            throw new Exception("Lỗi kết nối FPT AI Marketplace: " + e.getMessage());
        }

        if (response.getStatusCode() != HttpStatus.OK) {
            throw new Exception("FPT AI Marketplace trả về lỗi: " + response.getStatusCode());
        }

        JsonNode root = mapper.readTree(response.getBody());
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            throw new Exception("FPT AI Marketplace không trả về kết quả hợp lệ");
        }

        String rawContent = choices.get(0).path("message").path("content").asText("");
        String cleanJson = rawContent
                .replaceAll("(?s)```json", "")
                .replaceAll("(?s)```", "")
                .trim();

        try {
            return mapper.readTree(cleanJson);
        } catch (Exception e) {
            throw new Exception("Không thể parse JSON từ phản hồi model: " + e.getMessage() + " | raw: " + rawContent);
        }
    }

    // ────────────────────────────────────────────────────────────────
    // Helper: trích N khung hình từ video bằng ffmpeg/ffprobe (cần cài trên server)
    // ────────────────────────────────────────────────────────────────
    private List<byte[]> extractFramesFromVideo(byte[] videoBytes, String extension, int frameCount) throws Exception {
        Path tempVideo = Files.createTempFile("liveness_", "." + extension);
        try {
            Files.write(tempVideo, videoBytes);
            double duration = getVideoDurationSeconds(tempVideo);

            List<byte[]> frames = new ArrayList<>();
            for (int i = 0; i < frameCount; i++) {
                double t;
                if (duration <= 0) {
                    t = 0;
                } else if (frameCount == 1) {
                    t = duration / 2.0;
                } else {
                    t = Math.max(0, Math.min(duration - 0.05, (duration * i) / (frameCount - 1)));
                }
                frames.add(extractSingleFrame(tempVideo, t));
            }
            return frames;
        } finally {
            Files.deleteIfExists(tempVideo);
        }
    }

    private byte[] extractSingleFrame(Path videoPath, double timestampSeconds) throws Exception {
        Path outFrame = Files.createTempFile("frame_", ".jpg");
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "ffmpeg", "-y",
                    "-ss", String.valueOf(timestampSeconds),
                    "-i", videoPath.toString(),
                    "-frames:v", "1",
                    "-q:v", "3",
                    outFrame.toString()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Đọc hết stdout/stderr để tránh process bị treo do buffer đầy
            try (InputStream is = process.getInputStream()) {
                is.readAllBytes();
            }

            boolean finished = process.waitFor(15, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new Exception("ffmpeg timeout khi trích khung hình tại t=" + timestampSeconds + "s");
            }
            if (process.exitValue() != 0 || !Files.exists(outFrame) || Files.size(outFrame) == 0) {
                throw new Exception("ffmpeg thất bại khi trích khung hình tại t=" + timestampSeconds + "s (exit=" + process.exitValue() + ")");
            }

            return Files.readAllBytes(outFrame);
        } finally {
            Files.deleteIfExists(outFrame);
        }
    }

    private double getVideoDurationSeconds(Path videoPath) {
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "ffprobe", "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    videoPath.toString()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String output;
            try (InputStream is = process.getInputStream()) {
                output = new String(is.readAllBytes()).trim();
            }
            process.waitFor(10, TimeUnit.SECONDS);
            return Double.parseDouble(output);
        } catch (Exception e) {
            return 0; // fallback: dùng t=0 cho mọi frame nếu không lấy được duration
        }
    }

    private String detectImageMimeType(String filename) {
        if (filename != null && filename.toLowerCase().endsWith(".png")) {
            return "image/png";
        }
        return "image/jpeg";
    }
}