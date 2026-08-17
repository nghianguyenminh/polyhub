package com.polyhub.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Slf4j
@Service
public class TextExtractorService {

    public String extractTextFromPdf(InputStream inputStream) {
        try (PDDocument document = PDDocument.load(inputStream)) {
            if (document.isEncrypted()) {
                log.warn("Tài liệu PDF bị mã hóa, không thể đọc nội dung.");
                return null;
            }
            PDFTextStripper pdfStripper = new PDFTextStripper();
            return pdfStripper.getText(document);
        } catch (Exception e) {
            log.error("Lỗi khi trích xuất text từ PDF: {}", e.getMessage());
            return null;
        }
    }

    public String extractTextFromDocx(InputStream inputStream) {
        try (XWPFDocument doc = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        } catch (Exception e) {
            log.error("Lỗi khi trích xuất text từ DOCX: {}", e.getMessage());
            return null;
        }
    }
}
