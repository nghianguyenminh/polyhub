package com.polyhub.controller.api.admin;

import com.polyhub.entity.Group;
import com.polyhub.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/groups")
@RequiredArgsConstructor
public class AdminGroupApiController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<?> getGroups() {
        List<Group> groups = groupService.getAllGroups();
        
        Map<String, Object> response = new HashMap<>();
        response.put("groups", groups);
        
        return ResponseEntity.ok(response);
    }
}
