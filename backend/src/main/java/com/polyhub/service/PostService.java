package com.polyhub.service;

import com.polyhub.entity.Post;
import com.polyhub.entity.PostImage;
import com.polyhub.entity.User;
import com.polyhub.repository.PostImageRepository;
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
    private final NotificationService notificationService;
    private final PostImageRepository postImageRepository;

    public Post createPost(String content, MultipartFile[] images, String username) throws IOException {
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
        post.setHotScore(1.7677);

        if (images != null && images.length > 0) {
            int order = 0;
            if (post.getImages() == null) {
                post.setImages(new java.util.ArrayList<>());
            }
            for (MultipartFile image : images) {
                if (image != null && !image.isEmpty()) {
                    Map<String, Object> uploadResult = fileStorageService.uploadImage(image, "polyhub_posts");
                    String url = (String) uploadResult.get("url");
                    String publicId = (String) uploadResult.get("public_id");

                    // Ảnh đầu tiên gán vào field cũ (backward compatibility)
                    if (order == 0) {
                        post.setImageUrl(url);
                        post.setImagePublicId(publicId);
                    }

                    PostImage postImage = PostImage.builder()
                            .post(post)
                            .imageUrl(url)
                            .publicId(publicId)
                            .displayOrder(order)
                            .build();
                    post.getImages().add(postImage);
                    order++;
                }
            }
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

        Post savedPost = postRepository.save(sharedPost);

        if (rootPost.getUser() != null) {
            notificationService.createNotification(
                    rootPost.getUser().getUsername(),
                    username,
                    "đã chia sẻ bài viết của bạn.",
                    "SHARE",
                    savedPost.getId());
        }

        return savedPost;
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