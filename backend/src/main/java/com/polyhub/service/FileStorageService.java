package com.polyhub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.api.ApiResponse;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    // Inject đối tượng Cloudinary chúng ta đã cấu hình ở CloudinaryConfig
    private final Cloudinary cloudinary;

    private Map<String, Object> cachedUsage = null;
    private long lastCacheTime = 0;
    private static final long CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadImageWithModeration(MultipartFile file, String folder) throws IOException {
        Map<String, Object> options = ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "image",
                "moderation", "aws_rek" // Chuyển sang dùng Amazon Rekognition (cần bật Add-on trong Cloudinary Console)
        );
        Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        return uploadResult;
    }


@SuppressWarnings("unchecked")
public String extractModerationStatus(Map<String, Object> uploadResult) {
    Object moderationObj = uploadResult.get("moderation");
    if (moderationObj instanceof java.util.List<?> list && !list.isEmpty()
            && list.get(0) instanceof Map<?, ?> map) {
        Object status = map.get("status");
        return status != null ? status.toString() : null;
    }
    return null;
}

    /**
     * LẤY THÔNG TIN SỬ DỤNG DUNG LƯỢNG (USAGE) TỪ CLOUDINARY (Có Cache 10 phút)
     */
    @SuppressWarnings("unchecked")
    public synchronized Map<String, Object> getStorageUsage() {
        long now = System.currentTimeMillis();
        if (cachedUsage != null && (now - lastCacheTime) < CACHE_DURATION_MS) {
            return cachedUsage;
        }
        try {
            ApiResponse usage = cloudinary.api().usage(ObjectUtils.emptyMap());
            cachedUsage = (Map<String, Object>) (Map<?, ?>) usage;
            lastCacheTime = now;
            return cachedUsage;
        } catch (Exception e) {
            e.printStackTrace();
            return cachedUsage; // Trả về cache cũ nếu có lỗi gọi API
        }
    }

    /**
     * TẢI LÊN TÀI LIỆU (PDF, DOCX, v.v.)
     * Hàm này nhận file từ Frontend, đẩy lên Cloudinary dưới dạng "raw" để đảm bảo
     * file được lưu đúng loại, trình duyệt có thể xem trực tiếp thay vì tải về.
     *
     * LÝ DO DÙNG "raw" THAY VÌ "auto":
     * - "auto" có thể nhầm PDF/DOCX thành "image", khiến Cloudinary trả về
     *   Content-Disposition: attachment → trình duyệt tải file thay vì hiển thị.
     * - "raw" đảm bảo file luôn được lưu đúng loại tài liệu.
     *
     * @param file File cần upload (PDF, DOCX, ZIP, RAR,...)
     * @return Map chứa các thuộc tính do Cloudinary trả về (url, public_id, format, bytes,...)
     * @throws IOException Bắt lỗi nếu file bị hỏng hoặc lỗi mạng
     */
    /**
     * TẢI LÊN TÀI LIỆU (PDF, DOCX, v.v.)
     * Xác định loại file dựa vào đuôi mở rộng để thiết lập "resource_type" phù hợp:
     * - PDF/Hình ảnh: dùng "image" để trình duyệt có thể mở xem trực tiếp và hiển thị preview trên Cloudinary.
     * - Các định dạng khác (WORD, EXCEL, ZIP, RAR,...): dùng "raw" và đính kèm đuôi mở rộng vào public_id
     *   để file được lưu trữ và tải về đúng định dạng gốc.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadFile(MultipartFile file) throws IOException {
        return uploadFileBytes(file.getBytes(), file.getOriginalFilename());
    }

    /**
     * UPLOAD FILE TỪ BYTE ARRAY (Thread-safe)
     * Dùng khi cần gọi từ CompletableFuture / thread khác với request thread.
     * MultipartFile.getBytes() phải được đọc trước trên request thread,
     * rồi truyền byte[] vào đây để tránh lỗi truy cập cross-thread.
     *
     * @param fileBytes        Nội dung file đã được đọc sẵn (pre-read trên request thread)
     * @param originalFilename Tên file gốc để xác định extension và resource_type
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadFileBytes(byte[] fileBytes, String originalFilename) throws IOException {
        String extension = "";
        String baseName = "document";

        if (originalFilename != null && originalFilename.contains(".")) {
            int dotIndex = originalFilename.lastIndexOf(".");
            baseName = originalFilename.substring(0, dotIndex);
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        // Loại bỏ ký tự đặc biệt của baseName
        baseName = baseName.replaceAll("[^a-zA-Z0-9_-]", "_");
        if (baseName.isEmpty()) {
            baseName = "doc";
        }

        // Tạo tên định danh duy nhất (unique public id)
        String uniqueName = baseName + "_" + System.currentTimeMillis();

        String resourceType;
        String publicId;

        // Phân loại tài liệu
        if (isImageExtension(extension)) {
            resourceType = "image";
            publicId = uniqueName; // Image không đưa đuôi file vào public_id trên Cloudinary
        } else {
            resourceType = "raw";
            publicId = uniqueName + (extension.isEmpty() ? "" : "." + extension); // raw (bao gồm cả PDF) MUST có đuôi file
        }

        Map<String, Object> options = (Map<String, Object>) (Map<?, ?>) ObjectUtils.asMap(
                "folder", "polyhub_documents",
                "resource_type", resourceType,
                "public_id", publicId
        );

        // Upload lên Cloudinary (byte[] là thread-safe, không phụ thuộc HTTP request context)
        Map<String, Object> uploadResult = (Map<String, Object>) (Map<?, ?>) cloudinary.uploader().upload(fileBytes, options);

        return uploadResult;
    }

    private boolean isImageExtension(String ext) {
        if (ext == null) return false;
        return java.util.List.of("png", "jpg", "jpeg", "gif", "webp", "bmp", "svg").contains(ext.toLowerCase());
    }

    /**
     * TẢI HÌNH ẢNH (AVATAR, ẢNH BÌA) LÊN CLOUDINARY
     */
    public Map<String, Object> uploadImage(MultipartFile file, String folder) throws IOException {
        Map<String, Object> options = ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "image"
        );
        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
        return uploadResult;
    }

    /**
     * XÓA TÀI LIỆU
     * Hàm này dùng khi Admin hoặc User muốn xóa tài liệu đã được tải lên trước đó.
     * 
     * @param publicId ID công khai của file trên Cloudinary (lưu trong database)
     * @throws IOException Bắt lỗi nếu có trục trặc mạng
     */
    @SuppressWarnings("unchecked")
    public void deleteFile(String publicId) throws IOException {
        Map<String, Object> options = new java.util.HashMap<>();
        options.put("invalidate", true);
        
        // Xác định resource_type dựa vào đuôi file trong publicId
        String resourceType = "image";
        if (publicId != null && publicId.contains(".")) {
            String ext = publicId.substring(publicId.lastIndexOf(".") + 1).toLowerCase();
            // Nếu đuôi file thuộc nhóm raw (docx, xlsx, zip, rar, pdf, etc.)
            if (!java.util.List.of("png", "jpg", "jpeg", "gif", "webp", "bmp", "svg").contains(ext)) {
                resourceType = "raw";
            }
        }
        options.put("resource_type", resourceType);
        
        cloudinary.uploader().destroy(publicId, options);
    }
}
