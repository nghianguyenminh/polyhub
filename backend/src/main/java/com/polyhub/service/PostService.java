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
    private final NotificationService notificationService;

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

        Post savedPost = postRepository.save(sharedPost);

        if (rootPost.getUser() != null) {
            notificationService.createNotification(
                rootPost.getUser().getUsername(),
                username,
                "đã chia sẻ bài viết của bạn.",
                "SHARE",
                savedPost.getId()
            );
        }

        return savedPost;
    }

    // --- Tính năng Sửa bài viết ---
    public Post updatePost(Long postId, String newContent, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        if (!post.getUser().getUsername().equals(username)) {
            throw new AccessDeniedException("Bạn không có quyền sửa bài viết này");
        }

        post.setContent(newContent);
        return postRepository.save(post);
    }

    // --- Tính năng Xóa bài viết ---
    public void deletePost(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        if (!post.getUser().getUsername().equals(username)) {
            throw new AccessDeniedException("Bạn không có quyền xóa bài viết này");
        }

        postRepository.delete(post);
    }

    // --- Tính năng Chỉnh quyền riêng tư (Public/Private) ---
    public Post togglePrivacy(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        if (!post.getUser().getUsername().equals(username)) {
            throw new AccessDeniedException("Bạn không có quyền đổi trạng thái bài viết này");
        }

        // Đảo ngược trạng thái hiện tại (nếu null thì coi như cũ là false -> đảo thành true)
        boolean currentStatus = (post.getIsPrivate() != null) ? post.getIsPrivate() : false;
        post.setIsPrivate(!currentStatus);
        
        return postRepository.save(post);
    }

    // --- Tính năng Báo cáo (Report) bài viết ---
    public void reportPost(Long postId, String reason, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));
        
        User reporter = userRepository.findById(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        // Nếu users report chính bài mình thì chặn (Vô lý)
        if (post.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không thể báo cáo bài viết của chính mình");
        }

        // Chống Spam Report (1 người chỉ report 1 bài 1 lần)
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