package com.polyhub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

  private final Cloudinary cloudinary;

  public Map<String, Object> uploadFile(
    MultipartFile file,
    String folderName
  ) {
    try {
      return cloudinary
        .uploader()
        .upload(
          file.getBytes(),
          ObjectUtils.asMap("folder", folderName)
        );
    } catch (IOException e) {
      throw new RuntimeException("Could not upload file to Cloudinary", e);
    }
  }

  public void deleteFile(String publicId) {
    try {
      cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
    } catch (IOException e) {
      throw new RuntimeException("Could not delete file from Cloudinary", e);
    }
  }
}
