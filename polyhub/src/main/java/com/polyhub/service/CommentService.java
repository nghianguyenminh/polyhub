package com.polyhub.service;

import com.polyhub.dto.CommentDTO;
import com.polyhub.dto.CommentRequestDTO;
import com.polyhub.entity.Comment;
import com.polyhub.entity.Post;
import com.polyhub.entity.User;
import com.polyhub.repository.CommentRepository;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    // Lấy danh sách bình luận (có lồng ghép các reply bên trong nhờ mapToDTO)
    public List<CommentDTO> getCommentsByPostId(Long postId) {
        List<Comment> parentComments = commentRepository.findByPostIdAndParentCommentIsNullOrderByCreatedAtAsc(postId);
        return parentComments.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public CommentDTO addComment(CommentRequestDTO request, String username) {
        User user = userRepository.findById(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setPost(post);
        comment.setUser(user);

        // Nếu có parentId (là báo hiệu là 1 lượt trả lời bình luận)
        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Bình luận cha không tồn tại"));
            comment.setParentComment(parent);
        }

        Comment savedComment = commentRepository.save(comment);
        return mapToDTO(savedComment);
    }

    // Hàm chuyển đổi từ Entity sang DTO cho mục đích JSON trả về FE
    private CommentDTO mapToDTO(Comment comment) {
        CommentDTO dto = CommentDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .postId(comment.getPost().getId())
                .username(comment.getUser().getUsername())
                .fullname(comment.getUser().getFullname())
                .avatar(comment.getUser().getAvatar())
                .createdAt(comment.getCreatedAt())
                .build();

        if (comment.getParentComment() != null) {
            dto.setParentId(comment.getParentComment().getId());
        }

        // Đệ quy lấy danh sách reply vào bên trong (tránh lặp vô hạn JSON)
        if (comment.getReplies() != null && !comment.getReplies().isEmpty()) {
            dto.setReplies(comment.getReplies().stream()
                    .map(this::mapToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}