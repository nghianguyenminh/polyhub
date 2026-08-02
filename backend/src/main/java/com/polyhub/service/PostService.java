package com.polyhub.service;

import com.polyhub.entity.ModerationStatus;
import com.polyhub.entity.Post;
import com.polyhub.entity.PostImage;
import com.polyhub.entity.User;
import com.polyhub.repository.PostImageRepository;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.ContentModerationService.ModerationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.AccessDeniedException;
import com.polyhub.entity.PostReport;
import com.polyhub.repository.PostReportRepository;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PostReportRepository postReportRepository;
    private final NotificationService notificationService;
    private final PostImageRepository postImageRepository;
    private final ContentModerationService contentModerationService;

    /**
     * Tạo bài viết mới với kiểm duyệt nội dung qua AI trước khi lưu.
     * - Nội dung vi phạm (REJECTED) → throw ContentViolationException, không lưu DB.
     * - Nội dung nghi ngờ (PENDING_REVIEW) → lưu với trạng thái ẩn, chờ admin duyệt.
     * - Nội dung đạt chuẩn (APPROVED) → đăng bình thường.
     */
    public Post createPost(String content, MultipartFile[] images, String username) throws IOException {
        // --- Kiểm duyệt nội dung text qua AI ---
        String textToCheck = (content != null) ? content.trim() : "";
        ModerationResult moderationResult = ModerationResult.approved();
        
        if (!textToCheck.isBlank()) {
            moderationResult = contentModerationService.moderateContent(textToCheck);
            log.info("[Moderation] user={} verdict={} category={} source={}",
                    username, moderationResult.status(), moderationResult.category(), moderationResult.source());

            if (moderationResult.status() == ModerationStatus.REJECTED) {
                throw new ContentViolationException(
                        moderationResult.userMessage() != null
                                ? moderationResult.userMessage()
                                : "Bài viết vi phạm nội quy cộng đồng PolyHUB.");
            }
        }


    // --- Upload + kiểm duyệt ảnh qua Cloudinary AI Vision (gộp làm 1 lần gọi/ảnh) ---
java.util.List<Map<String, Object>> uploadedImageResults = new java.util.ArrayList<>();
if (images != null && images.length > 0) {
    for (MultipartFile image : images) {
        if (image != null && !image.isEmpty()) {
            Map<String, Object> uploadResult = fileStorageService.uploadImageWithModeration(image, "polyhub_posts");
            log.info("[DEBUG] Full upload result: {}", uploadResult);
            String modStatus = fileStorageService.extractModerationStatus(uploadResult);
            log.info("[Moderation][Image] user={} cloudinary_status={} public_id={}",
                    username, modStatus, uploadResult.get("public_id"));

            if ("rejected".equalsIgnoreCase(modStatus)) {
                // Rollback: xóa ảnh vừa bị từ chối + mọi ảnh đã upload thành công trước đó của bài này
                uploadedImageResults.add(uploadResult);
                for (Map<String, Object> r : uploadedImageResults) {
                    try {
                        fileStorageService.deleteFile((String) r.get("public_id"));
                    } catch (IOException e) {
                        log.error("[Moderation][Image] Không xóa được ảnh rác public_id={}", r.get("public_id"), e);
                    }
                }
                throw new ContentViolationException(
                        "Ảnh đăng kèm chứa nội dung không phù hợp với cộng đồng học tập PolyHUB. Vui lòng chọn ảnh khác!");
            }

            if (!"approved".equalsIgnoreCase(modStatus)) {
                // null hoặc "pending" (add-on rơi về async) → fail-safe, không tự ý coi là an toàn
                if (moderationResult.status() != ModerationStatus.PENDING_REVIEW) {
                    moderationResult = ModerationResult.pendingReview(
                            "IMAGE_MODERATION_UNCERTAIN",
                            "Không xác định được kết quả kiểm duyệt ảnh (status=" + modStatus + ").",
                            "CLOUDINARY_AI_VISION");
                }
            }

            uploadedImageResults.add(uploadResult);
        }
        
    }
}

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
        post.setModerationStatus(moderationResult.status());
        post.setModerationReason(moderationResult.reason());
        post.setModerationCategory(moderationResult.category());

        // Nếu PENDING_REVIEW → tự động khóa bài khỏi feed công khai
        if (moderationResult.status() == ModerationStatus.PENDING_REVIEW) {
            post.setIsPrivate(true);
            log.info("[Moderation] Bài viết của user={} được đặt PENDING_REVIEW, category={}",
                    username, moderationResult.category());
        }

        if (!uploadedImageResults.isEmpty()) {
    post.setImages(new java.util.ArrayList<>());
    int order = 0;
    for (Map<String, Object> uploadResult : uploadedImageResults) {
        String url = (String) uploadResult.get("url");
        String publicId = (String) uploadResult.get("public_id");

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

        // Kiểm duyệt nội dung mới khi chỉnh sửa
        if (newContent != null && !newContent.isBlank()) {
            ModerationResult result = contentModerationService.moderateContent(newContent.trim());
            log.info("[Moderation][Update] user={} verdict={} category={}",
                    username, result.status(), result.category());

            if (result.status() == ModerationStatus.REJECTED) {
                throw new ContentViolationException(
                        result.userMessage() != null
                                ? result.userMessage()
                                : "Nội dung chỉnh sửa vi phạm nội quy cộng đồng PolyHUB.");
            }

            // Cập nhật trạng thái kiểm duyệt sau khi sửa
            post.setModerationStatus(result.status());
            post.setModerationReason(result.reason());
            post.setModerationCategory(result.category());
            if (result.status() == ModerationStatus.PENDING_REVIEW) {
                post.setIsPrivate(true);
            }
        }

        post.setContent(newContent);
        return postRepository.save(post);
    }

    /**
     * Exception được throw khi AI xác định bài viết vi phạm nội quy.
     * Controller bắt exception này và trả về HTTP 422 kèm thông báo thân thiện.
     */
    public static class ContentViolationException extends RuntimeException {
        public ContentViolationException(String message) {
            super(message);
        }
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