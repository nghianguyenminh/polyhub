package com.polyhub.service;

import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.AccessDeniedException;
import com.polyhub.entity.PostReport;
import com.polyhub.repository.PostReportRepository;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PostReportRepository postReportRepository;

    public Post createPost(String content, MultipartFile image, String username) throws IOException {
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
        post.setHotScore(1.7677);

        if (image != null && !image.isEmpty()) {
            Map<String, Object> uploadResult = fileStorageService.uploadImage(image, "polyhub_posts");
            post.setImageUrl((String) uploadResult.get("url"));
            post.setImagePublicId((String) uploadResult.get("public_id"));
        }

        return postRepository.save(post);
    }

    public Post sharePost(Long originalPostId, String content, String username) {
        User user = userRepository.findById(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Post originalPost = postRepository.findById(originalPostId)
                .orElseThrow(() -> new RuntimeException("Bài viết gốc không tồn tại"));

        Post rootPost = originalPost.getSharedPost() != null ? originalPost.getSharedPost() : originalPost;

        Post sharedPost = new Post();
        sharedPost.setContent(content);
        sharedPost.setUser(user);
        sharedPost.setSharedPost(rootPost);
        sharedPost.setHotScore(1.7677);

        return postRepository.save(sharedPost);
    }

    public Post updatePost(Long postId, String newContent, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        if (!post.getUser().getUsername().equals(username)) {
            throw new AccessDeniedException("Bạn không có quyền sửa bài viết này");
        }

        post.setContent(newContent);
        return postRepository.save(post);
    }

    public void softDeletePost(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        if (!post.getUser().getUsername().equals(username)) {
            throw new AccessDeniedException("Bạn không có quyền xóa bài viết này");
        }

        post.setIsDeleted(true);
        postRepository.save(post);
    }

    public Post togglePrivacy(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        if (!post.getUser().getUsername().equals(username)) {
            throw new AccessDeniedException("Bạn không có quyền đổi trạng thái bài viết này");
        }

        boolean currentStatus = (post.getIsPrivate() != null) ? post.getIsPrivate() : false;
        post.setIsPrivate(!currentStatus);
        
        return postRepository.save(post);
    }

    public void reportPost(Long postId, String reason, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));
        
        User reporter = userRepository.findById(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        if (post.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không thể báo cáo bài viết của chính mình");
        }

        if (postReportRepository.existsByPostIdAndReporterUsername(postId, username)) {
            throw new RuntimeException("Bạn đã gửi báo cáo cho bài viết này rồi, hệ thống đang xem xét.");
        }

        PostReport report = new PostReport();
        report.setPost(post);
        report.setReporter(reporter);
        report.setReason(reason);

        postReportRepository.save(report);
    }
}