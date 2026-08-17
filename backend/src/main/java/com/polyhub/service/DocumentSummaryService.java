package com.polyhub.service;

import com.polyhub.entity.Document;
import com.polyhub.entity.SummaryStatus;
import com.polyhub.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentSummaryService {

    private final DocumentRepository documentRepository;
    private final TextExtractorService textExtractorService;
    private final AiService aiService;

    @Async("summaryTaskExecutor")
    @Transactional
    public void generateSummaryAsync(Long documentId) {
        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) return;

        try {
            document.setSummaryStatus(SummaryStatus.PROCESSING);
            documentRepository.save(document);

            String fileUrl = document.getFileUrl();
            String documentType = document.getDocumentType();

            if (!"PDF".equalsIgnoreCase(documentType) && !"WORD".equalsIgnoreCase(documentType)) {
                log.info("Không hỗ trợ tóm tắt cho định dạng: {}", documentType);
                updateStatus(document, SummaryStatus.UNSUPPORTED, null, null);
                return;
            }

            URL url = new URL(fileUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(30000); // 30 seconds
            connection.setReadTimeout(30000);
            connection.connect();

            String extractedText = null;
            try (InputStream inputStream = connection.getInputStream()) {
                if ("PDF".equalsIgnoreCase(documentType)) {
                    extractedText = textExtractorService.extractTextFromPdf(inputStream);
                } else if ("WORD".equalsIgnoreCase(documentType)) {
                    extractedText = textExtractorService.extractTextFromDocx(inputStream);
                }
            }

            if (extractedText == null || extractedText.trim().length() < 50) {
                log.info("Văn bản trích xuất quá ngắn hoặc không có text layer (có thể là ảnh scan).");
                updateStatus(document, SummaryStatus.UNSUPPORTED, null, null);
                return;
            }

            // Cắt 4000 từ đầu tiên
            String[] words = extractedText.split("\\s+");
            if (words.length > 4000) {
                StringBuilder truncated = new StringBuilder();
                for (int i = 0; i < 4000; i++) {
                    truncated.append(words[i]).append(" ");
                }
                extractedText = truncated.toString().trim();
            }

            AiService.DocumentSummaryResult result = aiService.summarizeDocument(extractedText);

            String keywordsStr = result.keywords().stream().collect(Collectors.joining(","));
            if (keywordsStr.length() > 500) {
                keywordsStr = keywordsStr.substring(0, 495) + "...";
            }

            updateStatus(document, SummaryStatus.COMPLETED, result.summary(), keywordsStr);

        } catch (Exception e) {
            log.error("Lỗi quá trình tóm tắt tài liệu ID = {}: {}", documentId, e.getMessage(), e);
            updateStatus(document, SummaryStatus.FAILED, null, null);
        }
    }

    private void updateStatus(Document document, SummaryStatus status, String summary, String keywords) {
        document.setSummaryStatus(status);
        if (summary != null) {
            document.setAiSummary(summary);
        }
        if (keywords != null) {
            document.setAiKeywords(keywords);
        }
        documentRepository.save(document);
    }
}
