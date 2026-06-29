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
    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadFile(MultipartFile file) throws IOException {

        // Dùng "raw" thay vì "auto" để Cloudinary luôn lưu đúng loại tài liệu,
        // tránh bị nhận diện nhầm thành "image" và bị trình duyệt tải về.
        Map<String, Object> options = (Map<String, Object>) (Map<?, ?>) ObjectUtils.asMap(
                "folder", "polyhub_documents",
                "resource_type", "raw"
        );

        // Chuyển file thành biến byte và upload lên Cloudinary
        Map<String, Object> uploadResult = (Map<String, Object>) (Map<?, ?>) cloudinary.uploader().upload(file.getBytes(), options);

        return uploadResult;
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
        // Khai báo tùy chọn xóa: invalidate = true để cưỡng chế xóa sạch bộ nhớ đệm (cache) trên máy chủ
        Map<String, Object> options = (Map<String, Object>) (Map<?, ?>) ObjectUtils.asMap(
            "invalidate", true,
            "resource_type", "raw" // Các file thư mục, zip, word,... thường được Cloud phân loại là "raw"
        );
        
        try {
            // Thử xóa đối tượng với tư cách là file "raw" (Tài liệu thông thường)
            cloudinary.uploader().destroy(publicId, options);
        } catch (Exception e) {
            // Nếu Cloudinary báo lỗi (Do nhận diện file này là hình ảnh - image), 
            // thì fallback lại xóa theo dạng image mặc định
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("invalidate", true));
        }
    }
}
