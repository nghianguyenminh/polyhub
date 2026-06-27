package com.polyhub.scheduler;

import com.polyhub.entity.Post;
import com.polyhub.repository.LikeRepository;
import com.polyhub.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class PostScheduler {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private LikeRepository likeRepository;

    /**
     * Tự động chạy mỗi 30 phút để tính toán lại điểm hot_score cho tất cả bài viết.
     * Sử dụng @Transactional để cho phép nạp lazy-load các list comments/shares từ Database mà không bị lỗi LazyInitializationException.
     */
    @Scheduled(fixedRate = 1800000) // 30 phút = 1800000 ms
    @Transactional
    public void updatePostHotScores() {
        List<Post> posts = postRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Post post : posts) {
            long likes = likeRepository.countByPostId(post.getId());
            long comments = post.getComments() != null ? post.getComments().size() : 0;
            long shares = post.getShares() != null ? post.getShares().size() : 0;

            // Tính số giờ đã trôi qua kể từ khi tạo bài viết
            LocalDateTime createdAt = post.getCreatedAt();
            if (createdAt == null) {
                createdAt = LocalDateTime.now();
            }
            long hours = Duration.between(createdAt, now).toHours();
            if (hours < 0) {
                hours = 0;
            }

            // Công thức tính Hot Score: (Likes * 2 + Comments * 3 + Shares * 5 + 5.0) / (Hours + 2)^1.5
            // Cộng thêm 5.0 ở tử số (Recency Boost) giúp bài viết mới đăng có điểm cơ bản cao để được hiển thị trước.
            double hotScore = (likes * 2.0 + comments * 3.0 + shares * 5.0 + 5.0) / Math.pow(hours + 2.0, 1.5);

            post.setHotScore(hotScore);
        }

        postRepository.saveAll(posts);
    }
}
