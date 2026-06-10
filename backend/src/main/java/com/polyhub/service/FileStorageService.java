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
     * TẢI LÊN TÀI LIỆU
     * Hàm này nhận file từ Frontend, đẩy lên Cloudinary và trả về thông tin chi tiết.
     * 
     * @param file File cần upload (PDF, DOCX, ZIP, RAR,...)
     * @return Map chứa các thuộc tính do Cloudinary trả về (url, public_id, format, bytes,...)
     * @throws IOException Bắt lỗi nếu file bị hỏng hoặc lỗi mạng
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadFile(MultipartFile file) throws IOException {
        
        // Cấu hình các tham số khi đẩy file lên cloud
        Map<String, Object> options = (Map<String, Object>) (Map<?, ?>) ObjectUtils.asMap(
                "folder", "polyhub_documents", // Tự động tạo thư mục trên Cloudinary để lưu file gọn gàng
                "resource_type", "auto"        // Tự động nhận diện loại file (image cho ảnh, raw cho zip/pdf/docx...)
        );

        // Chuyển file thành biến byte và upload thẳng lên Cloudinary
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
