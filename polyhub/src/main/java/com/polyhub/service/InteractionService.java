package com.polyhub.service;

import com.polyhub.entity.Comment;
import com.polyhub.entity.Like;
import com.polyhub.entity.Share;
import com.polyhub.entity.User;
import com.polyhub.repository.CommentRepository;
import com.polyhub.repository.LikeRepository;
import com.polyhub.repository.ShareRepository;
import com.polyhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final ShareRepository shareRepository;
    private final UserRepository userRepository;

    // --- LIKE ---
    public Map<String, Object> toggleLike(Long postId, String username) {
        Optional<Like> existingLike = likeRepository.findByPostIdAndUsername(postId, username);
        boolean isLiked;
        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            isLiked = false;
        } else {
            Like like = Like.builder()
                    .postId(postId)
                    .username(username)
                    .createdAt(LocalDateTime.now())
                    .build();
            likeRepository.save(like);
            isLiked = true;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("liked", isLiked);
        response.put("totalLikes", likeRepository.countByPostId(postId));
        return response;
    }

    public long getLikesCount(Long postId) {
        return likeRepository.countByPostId(postId);
    }
    
    public boolean isPostLikedByUser(Long postId, String username) {
        return likeRepository.findByPostIdAndUsername(postId, username).isPresent();
    }

    // --- COMMENT ---
    public Comment addComment(Long postId, String username, String content) {
        User user = userRepository.findById(username).orElse(null);
        String fullname = user != null && user.getFullname() != null ? user.getFullname() : username;
        String avatar = user != null && user.getAvatar() != null ? user.getAvatar() : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

        Comment comment = Comment.builder()
                .postId(postId)
                .username(username)
                .userFullname(fullname)
                .userAvatar(avatar)
                .content(content)
                .createdAt(LocalDateTime.now())
                .replies(new ArrayList<>())
                .build();
        return commentRepository.save(comment);
    }

    public Comment replyComment(String parentCommentId, String username, String content) {
        Optional<Comment> parentOpt = commentRepository.findById(parentCommentId);
        if (parentOpt.isPresent()) {
            Comment parent = parentOpt.get();
            User user = userRepository.findById(username).orElse(null);
            String fullname = user != null && user.getFullname() != null ? user.getFullname() : username;
            String avatar = user != null && user.getAvatar() != null ? user.getAvatar() : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

            Comment reply = Comment.builder()
                    .postId(parent.getPostId())
                    .username(username)
                    .userFullname(fullname)
                    .userAvatar(avatar)
                    .content(content)
                    .createdAt(LocalDateTime.now())
                    .build();
                    
            if (parent.getReplies() == null) {
                parent.setReplies(new ArrayList<>());
            }
            parent.getReplies().add(reply);
            return commentRepository.save(parent); // Update parent document
        }
        throw new RuntimeException("Comment not found");
    }

    public List<Comment> getCommentsByPostId(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }
    
    public long getCommentsCount(Long postId) {
        return commentRepository.countByPostId(postId);
    }

    // --- SHARE ---
    public Share sharePost(Long postId, String username, String destination) {
        Share share = Share.builder()
                .postId(postId)
                .username(username)
                .destination(destination)
                .createdAt(LocalDateTime.now())
                .build();
        return shareRepository.save(share);
    }

    public long getSharesCount(Long postId) {
        return shareRepository.countByPostId(postId);
    }
    
    // --- LẤY TỔNG HỢP ---
    public Map<String, Object> getPostInteractions(Long postId, String username) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalLikes", getLikesCount(postId));
        stats.put("totalComments", getCommentsCount(postId));
        stats.put("totalShares", getSharesCount(postId));
        stats.put("isLiked", isPostLikedByUser(postId, username));
        return stats;
    }
}