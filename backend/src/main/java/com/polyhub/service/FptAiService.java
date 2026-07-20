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

    @Value("${local.ocr.url:http://localhost:8001/ocr-cccd?side=auto}")
    private String localOcrUrl;

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
            ResponseEntity<String> response = restTemplate.postForEntity(localOcrUrl, requestEntity, String.class);
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

    @Value("${local.face.url:http://localhost:8002/verify-face}")
    private String localFaceUrl;

    /**
     * Xác thực Liveness (kiểm tra chuyển động qua nhiều frame) + so khớp
     * khuôn mặt (InsightFace buffalo_l), gọi sang service Python local.
     * Neu fpt.ai.api-key=mock -> tra ve du lieu gia de test UI khong can
     * chay service Python.
     */
    public JsonNode verifyLivenessAndFaceMatch(MultipartFile videoFile, MultipartFile cccdFile) throws Exception {

        if ("mock".equalsIgnoreCase(apiKey) || apiKey.trim().isEmpty()) {
            System.out.println("Using MOCK Liveness verification. Skipping actual API call.");
            ObjectNode mockResult = mapper.createObjectNode();
            mockResult.put("code", "200");
            mockResult.put("message", "Success");

            ObjectNode mockData = mapper.createObjectNode();

            ObjectNode mockLiveness = mapper.createObjectNode();
            mockLiveness.put("is_live", true);
            mockLiveness.put("deep_fake", false);
            mockData.set("liveness", mockLiveness);

            ObjectNode mockFaceMatch = mapper.createObjectNode();
            mockFaceMatch.put("isMatch", true);
            mockFaceMatch.put("similarity", 98.5);
            mockData.set("face_match", mockFaceMatch);

            mockResult.set("data", mockData);
            return mockResult;
        }

        String videoFilename = videoFile.getOriginalFilename();
        final String finalVideoFilename = (videoFilename != null && !videoFilename.isEmpty()) ? videoFilename : "video.webm";
        ByteArrayResource videoResource = new ByteArrayResource(videoFile.getBytes()) {
            @Override
            public String getFilename() {
                return finalVideoFilename;
            }
        };

        String cccdFilename = cccdFile.getOriginalFilename();
        final String finalCccdFilename = (cccdFilename != null && !cccdFilename.isEmpty()) ? cccdFilename : "cccd.jpg";
        ByteArrayResource cccdResource = new ByteArrayResource(cccdFile.getBytes()) {
            @Override
            public String getFilename() {
                return finalCccdFilename;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("video", videoResource);
        body.add("cccd", cccdResource);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(localFaceUrl, requestEntity, String.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                return mapper.readTree(response.getBody());
            } else {
                throw new Exception("Lỗi kết nối service Face: " + response.getStatusCode());
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception("Quá trình xác thực gương mặt thất bại: " + e.getMessage()
                    + " (kiểm tra xem service Python (uvicorn face_api:app --port 8002) đã chạy chưa)");
        }
    }
}