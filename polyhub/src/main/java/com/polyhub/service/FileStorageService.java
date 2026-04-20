package com.polyhub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.api.ApiResponse;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class FileStorageService {

  private final Cloudinary cloudinary;

  @SuppressWarnings("unchecked")
  public Map<String, Object> getStorageUsage() {
    try {
      ApiResponse usage = cloudinary.api().usage(ObjectUtils.emptyMap());
      return (Map<String, Object>) usage;
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    }
  }

  @SuppressWarnings("unchecked")
  public Map<String, Object> uploadFile(MultipartFile file) throws IOException {
    Map<String, Object> options = ObjectUtils.asMap(
      "folder",
      "polyhub_documents",
      "resource_type",
      "auto"
    );
    return cloudinary.uploader().upload(file.getBytes(), options);
  }

  @SuppressWarnings("unchecked")
  public Map<String, Object> uploadImage(MultipartFile file, String folder)
    throws IOException {
    Map<String, Object> options = ObjectUtils.asMap(
      "folder",
      folder,
      "resource_type",
      "image"
    );
    return cloudinary.uploader().upload(file.getBytes(), options);
  }

<<<<<<< HEAD
  @SuppressWarnings("unchecked")
  public void deleteFile(String publicId) throws IOException {
    Map<String, Object> options = ObjectUtils.asMap(
      "invalidate",
      true,
      "resource_type",
      "raw"
    );
    try {
      cloudinary.uploader().destroy(publicId, options);
    } catch (Exception e) {
      cloudinary
        .uploader()
        .destroy(publicId, ObjectUtils.asMap("invalidate", true));
=======
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
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
    }
  }
}
