package com.polyhub.controller.admin;

import com.polyhub.entity.User;
<<<<<<< HEAD
import com.polyhub.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
=======
import com.polyhub.entity.Role;
import com.polyhub.repository.UserRepository;
import com.polyhub.repository.RoleRepository;
import com.polyhub.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin/users")
<<<<<<< HEAD
public class UserAdminController {

    private final UserService userService;

    @GetMapping
    public String listUsers(Model model) {
        List<User> users = userService.getAllUsers();
        model.addAttribute("users", users);
        return "admin/users";
    }
=======
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'USER_ADMIN', 'CONTENT_ADMIN')")
public class UserAdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;

    @GetMapping
    public String users(@RequestParam(defaultValue = "1") int page, Model model) {
        Pageable pageable = PageRequest.of(page - 1, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage = userRepository.findAll(pageable);
        
        model.addAttribute("users", userPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", userPage.getTotalPages());
        
        return "admin/users";
    }

    @GetMapping("/detail/{id}")
    public String userDetail(@PathVariable("id") String username, Model model) {
        User user = userRepository.findById(username).orElse(null);
        if (user == null) {
            return "redirect:/admin/users";
        }
        
        long userAdminCount = userRepository.countByRole_Id("USER_ADMIN");
        long contentAdminCount = userRepository.countByRole_Id("CONTENT_ADMIN");
        
        model.addAttribute("user", user);
        model.addAttribute("userAdminCount", userAdminCount);
        model.addAttribute("contentAdminCount", contentAdminCount);
        // Thiết lập giới hạn
        model.addAttribute("MAX_USER_ADMIN", 2);
        model.addAttribute("MAX_CONTENT_ADMIN", 2);

        return "admin/user_detail";
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'USER_ADMIN')")
    @PostMapping("/lock/{id}")
    public String lockUser(@PathVariable("id") String username, 
                           @RequestParam("reason") String reason, 
                           RedirectAttributes redirectAttributes) {
        User user = userRepository.findById(username).orElse(null);
        if (user != null && user.getActive()) {
            user.setActive(false);
            userRepository.save(user);

            // Gửi email thông báo khóa tài khoản
            emailService.sendAccountLockEmail(user.getEmail(), user.getFullname(), reason);
            
            redirectAttributes.addFlashAttribute("successMessage", "Đã khóa người dùng " + username + " thành công.");
        }
        return "redirect:/admin/users/detail/" + username;
    }

    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'USER_ADMIN')")
    @PostMapping("/unlock/{id}")
    public String unlockUser(@PathVariable("id") String username, 
                             RedirectAttributes redirectAttributes) {
        User user = userRepository.findById(username).orElse(null);
        if (user != null && !user.getActive()) {
            user.setActive(true);
            userRepository.save(user);

            // Gửi email thông báo mở khóa
            emailService.sendAccountUnlockEmail(user.getEmail(), user.getFullname());
            
            redirectAttributes.addFlashAttribute("successMessage", "Đã mở khóa người dùng " + username + " thành công.");
        }
        return "redirect:/admin/users/detail/" + username;
    }

    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @PostMapping("/roles/{id}")
    public String changeRole(@PathVariable("id") String username,
                             @RequestParam("roleId") String roleId,
                             RedirectAttributes redirectAttributes) {
        User user = userRepository.findById(username).orElse(null);
        Role role = roleRepository.findById(roleId).orElse(null);
        
        if (user != null && role != null) {
            // Kiểm tra limit:
            if (roleId.equals("USER_ADMIN") && (user.getRole() == null || !user.getRole().getId().equals("USER_ADMIN"))) {
                long current = userRepository.countByRole_Id("USER_ADMIN");
                if (current >= 2) {
                    redirectAttributes.addFlashAttribute("errorMessage", "Cập nhật thất bại: Đã đạt giới hạn số lượng Admin Quản lý Người dùng (Maximum 2).");
                    return "redirect:/admin/users/detail/" + username;
                }
            } else if (roleId.equals("CONTENT_ADMIN") && (user.getRole() == null || !user.getRole().getId().equals("CONTENT_ADMIN"))) {
                long current = userRepository.countByRole_Id("CONTENT_ADMIN");
                if (current >= 2) {
                    redirectAttributes.addFlashAttribute("errorMessage", "Cập nhật thất bại: Đã đạt giới hạn số lượng Admin Quản lý Nội dung (Maximum 2).");
                    return "redirect:/admin/users/detail/" + username;
                }
            }

            user.setRole(role);
            userRepository.save(user);

            // Gửi email thông báo cập nhật quyền hạn
            emailService.sendRoleAssignmentEmail(user.getEmail(), user.getFullname(), role.getName());

            redirectAttributes.addFlashAttribute("successMessage", "Đã cập nhật quyền thành công cho người dùng " + username + ".");
        } else {
            redirectAttributes.addFlashAttribute("errorMessage", "Cập nhật quyền thất bại.");
        }
        return "redirect:/admin/users/detail/" + username;
    }
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
}
