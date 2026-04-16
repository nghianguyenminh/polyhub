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


    // --- Tính năng Share bài viết ---
    public Post sharePost(Long originalPostId, String content, String username) {
        User user = userRepository.findById(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Post originalPost = postRepository.findById(originalPostId)
                .orElseThrow(() -> new RuntimeException("Bài viết gốc không tồn tại"));

        // Chống lồng quá sâu: Nếu bài gốc đã là 1 bài share, thì móc thẳng tới bài rễ (root post)
        Post rootPost = originalPost.getSharedPost() != null ? originalPost.getSharedPost() : originalPost;

        Post sharedPost = new Post();
        sharedPost.setContent(content); // Lời tựa người dùng thêm vào
        sharedPost.setUser(user);
        sharedPost.setSharedPost(rootPost);

        return postRepository.save(sharedPost);
    }
}