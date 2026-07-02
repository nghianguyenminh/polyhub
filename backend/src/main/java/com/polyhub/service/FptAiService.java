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

    private static final String FPT_AI_OCR_URL = "https://api.fpt.ai/vision/idr/vnm";
    private static final String FPT_AI_LIVENESS_URL = "https://api.fpt.ai/dmp/liveness/v3";

    /**
     * Trích xuất thông tin chi tiết CCCD/CMND bằng API FPT.AI
     */
    public JsonNode extractCccdDetails(MultipartFile imageFile) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        if ("mock".equalsIgnoreCase(apiKey) || apiKey.trim().isEmpty()) {
            System.out.println("Using MOCK FPT.AI OCR verification. Skipping actual API call.");
            // Giả lập kết quả OCR thành công cho mục đích thử nghiệm
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

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("api-key", apiKey);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        HttpHeaders imageHeaders = new HttpHeaders();
        String filename = imageFile.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".png")) {
            imageHeaders.setContentType(MediaType.IMAGE_PNG);
        } else {
            imageHeaders.setContentType(MediaType.IMAGE_JPEG);
        }
        
        final String finalFilename = (filename != null && !filename.isEmpty()) ? filename : "image.jpg";
        ByteArrayResource fileResource = new ByteArrayResource(imageFile.getBytes()) {
            @Override
            public String getFilename() {
                return finalFilename;
            }
        };
        body.add("image", new HttpEntity<>(fileResource, imageHeaders));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(FPT_AI_OCR_URL, requestEntity, String.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                return mapper.readTree(response.getBody());
            } else {
                throw new Exception("Lỗi kết nối FPT.AI API: " + response.getStatusCode());
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception("Quá trình trích xuất thông tin CCCD thất bại: " + e.getMessage());
        }
    }

    /**
     * Xác thực Liveness gương mặt và so khớp ảnh CCCD bằng API FPT.AI Liveness V3
     */
    public JsonNode verifyLivenessAndFaceMatch(MultipartFile videoFile, MultipartFile cccdFile) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        if ("mock".equalsIgnoreCase(apiKey) || apiKey.trim().isEmpty()) {
            System.out.println("Using MOCK FPT.AI Liveness verification. Skipping actual API call.");
            // Giả lập kết quả Liveness thành công cho mục đích thử nghiệm
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

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("api-key", apiKey);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        
        // Thêm file video ghi hình gương mặt
        HttpHeaders videoHeaders = new HttpHeaders();
        videoHeaders.setContentType(MediaType.valueOf("video/mp4"));
        final String videoFilename = (videoFile.getOriginalFilename() != null && !videoFile.getOriginalFilename().isEmpty()) ? videoFile.getOriginalFilename() : "video.mp4";
        ByteArrayResource videoResource = new ByteArrayResource(videoFile.getBytes()) {
            @Override
            public String getFilename() {
                return videoFilename;
            }
        };
        body.add("video", new HttpEntity<>(videoResource, videoHeaders));
        
        // Thêm file ảnh mặt trước CCCD
        HttpHeaders cccdHeaders = new HttpHeaders();
        String cccdOriginalName = cccdFile.getOriginalFilename();
        if (cccdOriginalName != null && cccdOriginalName.toLowerCase().endsWith(".png")) {
            cccdHeaders.setContentType(MediaType.IMAGE_PNG);
        } else {
            cccdHeaders.setContentType(MediaType.IMAGE_JPEG);
        }
        final String cccdFilename = (cccdOriginalName != null && !cccdOriginalName.isEmpty()) ? cccdOriginalName : "cccd.jpg";
        ByteArrayResource cccdResource = new ByteArrayResource(cccdFile.getBytes()) {
            @Override
            public String getFilename() {
                return cccdFilename;
            }
        };
        body.add("cmnd", new HttpEntity<>(cccdResource, cccdHeaders));

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(FPT_AI_LIVENESS_URL, requestEntity, String.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                return mapper.readTree(response.getBody());
            } else {
                throw new Exception("Lỗi kết nối FPT.AI Liveness API: " + response.getStatusCode());
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception("Quá trình xác thực gương mặt eKYC thất bại: " + e.getMessage());
        }
    }
}
