package com.polyhub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CloudinaryService {

  @Autowired
  private Cloudinary cloudinary;

  public String uploadFile(
    MultipartFile file,
    String folderName
  ) {
    try {
      Map<String, Object> uploadResult = cloudinary
        .uploader()
        .upload(
          file.getBytes(),
          ObjectUtils.asMap("folder", folderName)
        );
      return (String) uploadResult.get("url");
    } catch (IOException e) {
      throw new RuntimeException("Could not upload file to Cloudinary", e);
    }
  }
}
