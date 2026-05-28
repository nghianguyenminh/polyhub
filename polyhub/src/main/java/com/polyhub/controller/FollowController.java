package com.polyhub.controller;

import com.polyhub.service.FollowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/follows")
public class FollowController {

    @Autowired
    private FollowService followService;

    @PostMapping("/{username}/follow")
    public ResponseEntity<Void> follow(@PathVariable("username") String username, Principal principal) {
        followService.follow(principal.getName(), username);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{username}/unfollow")
    public ResponseEntity<Void> unfollow(@PathVariable("username") String username, Principal principal) {
        followService.unfollow(principal.getName(), username);
        return ResponseEntity.ok().build();
    }
}
