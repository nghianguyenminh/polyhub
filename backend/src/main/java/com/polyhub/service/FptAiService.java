package com.polyhub.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private static final String FPT_AI_URL = "https://api.fpt.ai/vision/idr/vnm";

    public String extractCccdNumber(MultipartFile imageFile) throws Exception {
        if ("mock".equalsIgnoreCase(apiKey) || apiKey.trim().isEmpty()) {
            System.out.println("Using MOCK FPT.AI verification. Skipping actual API call.");
            // Giả lập thành công và trả về số CCCD fake
            return "012345678901";
        }

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("api_key", apiKey);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        // Wrap MultipartFile into a ByteArrayResource to correctly send via RestTemplate
        ByteArrayResource fileResource = new ByteArrayResource(imageFile.getBytes()) {
            @Override
            public String getFilename() {
                return imageFile.getOriginalFilename() != null ? imageFile.getOriginalFilename() : "image.jpg";
            }
        };
        body.add("image", fileResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(FPT_AI_URL, requestEntity, String.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(response.getBody());

                int errorCode = root.path("errorCode").asInt(-1);
                if (errorCode == 0) {
                    JsonNode dataArray = root.path("data");
                    if (dataArray.isArray() && dataArray.size() > 0) {
                        JsonNode data = dataArray.get(0);
                        String id = data.path("id").asText();
                        if (id != null && !id.isEmpty()) {
                            return id;
                        }
                    }
                    throw new Exception("Không tìm thấy thông tin số CCCD/CMND trên ảnh");
                } else {
                    String errorMsg = root.path("errorMessage").asText("Lỗi không xác định");
                    throw new Exception("FPT.AI Error: " + errorMsg);
                }
            } else {
                throw new Exception("Lỗi kết nối FPT.AI API: " + response.getStatusCode());
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception("Quá trình xác thực CCCD thất bại: " + e.getMessage());
        }
    }
}
