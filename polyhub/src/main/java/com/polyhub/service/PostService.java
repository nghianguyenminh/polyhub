package com.polyhub.service;

import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public Post createPost(String content, MultipartFile image, String username) throws IOException {
        // Tìm User trong DB, nếu không có thì lấy một tài khoản mặc định để demo
        User user = userRepository.findById(username).orElseGet(() -> {
            User newUser = new User();
            newUser.setUsername(username);
            newUser.setFullname("Người dùng Demo");
            newUser.setEmail(username + "@fpt.edu.vn");
            newUser.setPassword("123456");
            return userRepository.save(newUser);
        });

        Post post = new Post();
        post.setContent(content);
        post.setUser(user);

        // Nêú có ảnh đính kèm thì upload lên Cloudinary
        if (image != null && !image.isEmpty()) {
            Map<String, Object> uploadResult = fileStorageService.uploadFile(image);
            post.setImageUrl((String) uploadResult.get("url"));
            post.setImagePublicId((String) uploadResult.get("public_id"));
        }

        return postRepository.save(post);
    }

    public java.util.Optional<Post> getPostById(Long id) {
        return postRepository.findById(id);
    }

    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }
}