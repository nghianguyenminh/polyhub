package com.polyhub.controller;

import com.polyhub.entity.Comment;
import com.polyhub.entity.Share;
import com.polyhub.service.InteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts/{postId}")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;

    // --- LẤY TỔNG HỢP ---
    @GetMapping("/interactions")
    public ResponseEntity<Map<String, Object>> getInteractions(@PathVariable Long postId, Principal principal) {
        String username = (principal != null) ? principal.getName() : null;
        return ResponseEntity.ok(interactionService.getPostInteractions(postId, username));
    }

    // --- LIKE ---
    @PostMapping("/like")
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable Long postId, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build(); // Yêu cầu đăng nhập
        }
        return ResponseEntity.ok(interactionService.toggleLike(postId, principal.getName()));
    }

    // --- COMMENT ---
    @GetMapping("/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(interactionService.getCommentsByPostId(postId));
    }

    @PostMapping("/comment")
    public ResponseEntity<Comment> addComment(
            @PathVariable Long postId,
            @RequestBody Map<String, String> body,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build(); 
        }
        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(interactionService.addComment(postId, principal.getName(), content));
    }

    @PostMapping("/comment/{commentId}/reply")
    public ResponseEntity<Comment> replyComment(
            @PathVariable Long postId,
            @PathVariable String commentId,
            @RequestBody Map<String, String> body,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build(); 
        }
        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(interactionService.replyComment(commentId, principal.getName(), content));
    }

    // --- SHARE ---
    @PostMapping("/share")
    public ResponseEntity<Share> sharePost(
            @PathVariable Long postId,
            @RequestBody(required = false) Map<String, String> body,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build(); // Yêu cầu đăng nhập
        }
        String destination = (body != null && body.containsKey("destination")) 
                ? body.get("destination") : "General";
        return ResponseEntity.ok(interactionService.sharePost(postId, principal.getName(), destination));
    }
}