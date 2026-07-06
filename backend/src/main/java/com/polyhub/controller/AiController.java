package com.polyhub.controller;

import com.polyhub.service.AiService;
import com.polyhub.service.FptAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private AiService aiService;

    @Autowired
    private FptAiService fptAiService;

    @PostMapping("/verify-face")
    public ResponseEntity<?> verifyFace(
            @RequestParam("video") MultipartFile video,
            @RequestParam("cccd") MultipartFile cccd) {
        try {
            com.fasterxml.jackson.databind.JsonNode result = fptAiService.verifyLivenessAndFaceMatch(video, cccd);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/ocr-cccd")
    public ResponseEntity<?> ocrCccd(@RequestParam("image") MultipartFile image) {
        try {
            com.fasterxml.jackson.databind.JsonNode result = fptAiService.extractCccdDetails(image);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/suggest-caption")
    public ResponseEntity<String> suggestCaptionFromImage(@RequestParam("image") MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng chọn ảnh!");
        }
        String suggestion = aiService.suggestCaption(image);
        return ResponseEntity.ok(suggestion);
    }

    @PostMapping("/improve-text")
    public ResponseEntity<String> improveText(@RequestBody Map<String, String> payload) {
        String text = payload.get("text");
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Nội dung không được để trống.");
        }
        String improved = aiService.improveText(text);
        return ResponseEntity.ok(improved);
    }
}