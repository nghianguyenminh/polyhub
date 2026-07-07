package com.polyhub.controller.api;

import com.polyhub.entity.User;
import com.polyhub.entity.SavedDocument;
import com.polyhub.entity.SavedPost;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.client.SavedDocumentService;
import com.polyhub.service.client.SavedPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/saved")
public class SavedApiController {

    @Autowired
    private SavedDocumentService savedDocumentService;

    @Autowired
    private SavedPostService savedPostService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getSaved(
            @RequestParam(value = "type", defaultValue = "documents") String type,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "8") int size,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Vui lòng đăng nhập!"));
        }

        User currentUser = userRepository.findById(principal.getName()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Người dùng không tồn tại"));
        }

        long totalSavedDocs = savedDocumentService.countSavedDocumentsByUser(currentUser);
        Page<SavedPost> allSavedPosts = savedPostService.getSavedPostsByUser(currentUser, PageRequest.of(0, 99999));
        long totalSavedPosts = allSavedPosts.getTotalElements();

        Map<String, Object> response = new HashMap<>();
        response.put("type", type);
        response.put("totalSavedDocs", totalSavedDocs);
        response.put("totalSavedPosts", totalSavedPosts);

        if ("documents".equals(type)) {
            Page<SavedDocument> savedDocsPage = savedDocumentService.getSavedDocumentsByUser(currentUser, page, size);
            List<Map<String, Object>> docsList = savedDocsPage.getContent().stream()
                    .map(sd -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", sd.getId());
                        map.put("savedAt", sd.getSavedAt());
                        if (sd.getDocument() != null) {
                            Map<String, Object> docMap = new HashMap<>();
                            docMap.put("id", sd.getDocument().getId());
                            docMap.put("title", sd.getDocument().getTitle());
                            docMap.put("description", sd.getDocument().getDescription());
                            docMap.put("documentType", sd.getDocument().getDocumentType());
                            docMap.put("fileUrl", sd.getDocument().getFileUrl());
                            docMap.put("fileSize", sd.getDocument().getFileSize());
                            docMap.put("downloadCount", sd.getDocument().getDownloadCount());
                            docMap.put("createdAt", sd.getDocument().getCreatedAt());
                            if (sd.getDocument().getUploader() != null) {
                                docMap.put("uploader", Map.of(
                                        "username", sd.getDocument().getUploader().getUsername(),
                                        "fullname", sd.getDocument().getUploader().getFullname(),
                                        "avatar", sd.getDocument().getUploader().getAvatar()
                                ));
                            }
                            map.put("document", docMap);
                        }
                        return map;
                    })
                    .collect(Collectors.toList());

            response.put("savedDocs", docsList);
            response.put("content", docsList);
            response.put("currentPage", savedDocsPage.getNumber() + 1);
            response.put("totalPages", savedDocsPage.getTotalPages());
            response.put("hasNext", savedDocsPage.hasNext());
        } else if ("posts".equals(type)) {
            Page<SavedPost> savedPostsPage = savedPostService.getSavedPostsByUser(currentUser, PageRequest.of(page - 1, size));
            List<Map<String, Object>> postsList = savedPostsPage.getContent().stream()
                    .map(sp -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", sp.getId());
                        map.put("savedAt", sp.getSavedAt());
                        if (sp.getPost() != null) {
                            Map<String, Object> postMap = new HashMap<>();
                            postMap.put("id", sp.getPost().getId());
                            
                            if (Boolean.TRUE.equals(sp.getPost().getIsDeleted())) {
                                postMap.put("content", "Bài viết đã bị xóa");
                                postMap.put("imageUrl", null);
                            } else {
                                postMap.put("content", sp.getPost().getContent());
                                postMap.put("imageUrl", sp.getPost().getImageUrl());
                            }
                            
                            postMap.put("isDeleted", sp.getPost().getIsDeleted());
                            postMap.put("isPrivate", sp.getPost().getIsPrivate());
                            postMap.put("createdAt", sp.getPost().getCreatedAt());
                            
                            if (sp.getPost().getUser() != null) {
                                postMap.put("user", Map.of(
                                        "username", sp.getPost().getUser().getUsername(),
                                        "fullname", sp.getPost().getUser().getFullname(),
                                        "avatar", sp.getPost().getUser().getAvatar()
                                ));
                            }
                            map.put("post", postMap);
                        }
                        return map;
                    })
                    .collect(Collectors.toList());

            response.put("savedPosts", postsList);
            response.put("content", postsList);
            response.put("currentPage", savedPostsPage.getNumber() + 1);
            response.put("totalPages", savedPostsPage.getTotalPages());
            response.put("hasNext", savedPostsPage.hasNext());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping({"/posts/toggle", "/togglePost"})
    public ResponseEntity<?> toggleSavedPost(
            @RequestParam("postId") Long postId,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Vui lòng đăng nhập để lưu bài viết!"));
        }

        User currentUser = userRepository.findById(principal.getName()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Người dùng không tồn tại"));
        }

        try {
            boolean isSaved = savedPostService.toggleSavePost(currentUser, postId);
            return ResponseEntity.ok(Map.of(
                    "saved", isSaved,
                    "message", isSaved ? "Đã lưu bài viết vào danh sách!" : "Đã hủy lưu bài viết!"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping({"/documents/toggle", "/toggle"})
    public ResponseEntity<?> toggleSavedDocument(
            @RequestParam("documentId") Long documentId,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Vui lòng đăng nhập!"));
        }

        User currentUser = userRepository.findById(principal.getName()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Người dùng không tồn tại"));
        }

        try {
            boolean isSaved = savedDocumentService.toggleSaveDocument(currentUser, documentId);
            return ResponseEntity.ok(Map.of(
                    "saved", isSaved,
                    "message", isSaved ? "Đã lưu tài liệu!" : "Đã bỏ lưu tài liệu!"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}