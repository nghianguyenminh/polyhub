package com.polyhub.service;

import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import java.io.IOException;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class PostService {

  private final PostRepository postRepository;
  private final UserRepository userRepository;
  private final FileStorageService fileStorageService;

  public Post createPost(String content, MultipartFile image, String username)
    throws IOException {
    User user = userRepository
      .findById(username)
      .orElseGet(() -> {
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setFullname("Người dùng Demo");
        newUser.setEmail(username + "@fpt.edu.vn");
        newUser.setPassword("123456");
        return userRepository.save(newUser);
      });

    String imageUrl = null;
    String imagePublicId = null;

    if (image != null && !image.isEmpty()) {
      Map<String, Object> uploadResult = fileStorageService.uploadFile(image);
      imageUrl = (String) uploadResult.get("url");
      imagePublicId = (String) uploadResult.get("public_id");
    }

    Post post = new Post(
      null,
      content,
      imageUrl,
      imagePublicId,
      user,
      null
    );

    return postRepository.save(post);
  }
}