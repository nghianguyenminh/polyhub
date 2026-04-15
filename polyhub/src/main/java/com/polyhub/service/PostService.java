package com.polyhub.service;

import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.FileStorageService;
import java.io.IOException;
import java.time.LocalDateTime;
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
      .findByUsername(username)
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
      Map<String, Object> uploadResult = fileStorageService.uploadImage(image, "polyhub_posts");
      imageUrl = (String) uploadResult.get("url");
      imagePublicId = (String) uploadResult.get("public_id");
    }

    Post post = new Post();
    post.setContent(content);
    post.setImageUrl(imageUrl);
    post.setImagePublicId(imagePublicId);
    post.setUser(user);
    post.setCreatedAt(LocalDateTime.now());

    return postRepository.save(post);
  }
}
