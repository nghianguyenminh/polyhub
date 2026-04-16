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

  @SuppressWarnings("rawtypes")
  public Map<String, Object> getStorageUsage() {
    try {
      ApiResponse usage = cloudinary.api().usage(ObjectUtils.emptyMap());
      return (Map<String, Object>) usage;
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    }
  }

  @SuppressWarnings("rawtypes")
  public Map<String, Object> uploadFile(MultipartFile file) throws IOException {
    Map<String, Object> options = ObjectUtils.asMap(
      "folder",
      "polyhub_documents",
      "resource_type",
      "auto"
    );
    return cloudinary.uploader().upload(file.getBytes(), options);
  }

  @SuppressWarnings("rawtypes")
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

  @SuppressWarnings("rawtypes")
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
    }
  }
}
