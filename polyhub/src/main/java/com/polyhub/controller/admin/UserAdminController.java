
package com.polyhub.controller.admin;

import com.polyhub.entity.User;
import com.polyhub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/admin/users")
public class UserAdminController {

    @Autowired
    private UserService userService;

    @GetMapping
    public String userManagement(Model model) {
        List<User> users = userService.getAllUsers();
        model.addAttribute("users", users);
        return "admin/user_management";
    }

    @PostMapping("/toggle-lock/{id}")
    public String toggleLock(@PathVariable String id) {
        userService.toggleLock(id);
        return "redirect:/admin/users";
    }

    @PostMapping("/approve-mentor/{id}")
    public String approveMentor(@PathVariable String id) {
        userService.approveMentor(id);
        return "redirect:/admin/users";
    }
}
