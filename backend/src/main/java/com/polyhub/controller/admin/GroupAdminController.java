package com.polyhub.controller.admin;

import com.polyhub.entity.Group;
import com.polyhub.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/admin/groups")
public class GroupAdminController {

    @Autowired
    private GroupService groupService;

    @GetMapping
    public String getGroups(Model model) {
        List<Group> groups = groupService.getAllGroups();
        model.addAttribute("groups", groups);
        return "admin/groups";
    }

}
