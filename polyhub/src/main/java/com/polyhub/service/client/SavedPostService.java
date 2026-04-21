package com.polyhub.service.client;

import com.polyhub.entity.Post;
import com.polyhub.entity.SavedPost;
import com.polyhub.entity.User;
import com.polyhub.repository.PostRepository;
import com.polyhub.repository.SavedPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final PostRepository postRepository;

    @Transactional
    public boolean toggleSavePost(User user, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết."));

        Optional<SavedPost> savedOpt = savedPostRepository.findByUserAndPost(user, post);

        if (savedOpt.isPresent()) {
            savedPostRepository.delete(savedOpt.get());
            return false; // Trả về false nghĩa là Unsave
        } else {
            SavedPost savedPost = SavedPost.builder()
                    .user(user)
                    .post(post)
                    .build();
            savedPostRepository.save(savedPost);
            return true; // Trả về true nghĩa là Saved
        }
    }

    public Page<SavedPost> getSavedPostsByUser(User user, Pageable pageable) {
        return savedPostRepository.findByUserOrderBySavedAtDesc(user, pageable);
    }
}
