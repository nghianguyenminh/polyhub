package com.polyhub.repository.mongodb;

import com.polyhub.entity.Like;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends MongoRepository<Like, String> {
    long countByPostId(Long postId);
    Optional<Like> findByPostIdAndUsername(Long postId, String username);
    void deleteByPostIdAndUsername(Long postId, String username);
}