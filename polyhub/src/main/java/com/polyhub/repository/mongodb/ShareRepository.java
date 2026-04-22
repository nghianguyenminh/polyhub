package com.polyhub.repository.mongodb;

import com.polyhub.entity.Share;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShareRepository extends MongoRepository<Share, String> {
    long countByPostId(Long postId);
}