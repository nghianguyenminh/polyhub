package com.polyhub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FptAiService {

    @Value("${fpt.ai.api-key:mock}")
    private String apiKey;

    // Service Python local thay the cho FPT.AI OCR (PaddleOCR detect + VietOCR doc chu)
    private static final String LOCAL_OCR_URL = "http://localhost:8001/ocr-cccd?side=auto";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Trích xuất thông tin CCCD/CMND.
     * Neu fpt.ai.api-key=mock (mac dinh) -> tra ve du lieu gia de test UI.
     * Nguoc lai -> goi sang service Python local (PaddleOCR + VietOCR).
     */
    public JsonNode extractCccdDetails(MultipartFile imageFile) throws Exception {

        if ("mock".equalsIgnoreCase(apiKey) || apiKey.trim().isEmpty()) {
            System.out.println("Using MOCK OCR verification. Skipping actual API call.");
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

            mockResult.putArray("data").add(mockData);
            return mockResult;
        }

        String filename = imageFile.getOriginalFilename();
        final String finalFilename = (filename != null && !filename.isEmpty()) ? filename : "image.jpg";

        ByteArrayResource fileResource = new ByteArrayResource(imageFile.getBytes()) {
            @Override
            public String getFilename() {
                return finalFilename;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", fileResource);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(LOCAL_OCR_URL, requestEntity, String.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                return mapper.readTree(response.getBody());
            } else {
                throw new Exception("Lỗi kết nối service OCR: " + response.getStatusCode());
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception("Quá trình trích xuất thông tin CCCD thất bại: " + e.getMessage()
                    + " (kiểm tra xem service Python (uvicorn cccd_ocr_api:app --port 8001) đã chạy chưa)");
        }
    }

    /**
     * Xác thực Liveness + so khớp khuôn mặt.
     * FPT.AI Liveness V3 đã ngừng hoạt động và CHƯA có bản thay thế local
     * (đang để dành làm ở giai đoạn sau). Tạm thời luôn dùng mock để không
     * chặn luồng đăng ký mentor.
     */
    public JsonNode verifyLivenessAndFaceMatch(MultipartFile videoFile, MultipartFile cccdFile) throws Exception {
        System.out.println("Using MOCK Liveness verification (chua migrate khoi FPT.AI).");
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
}