package com.polyhub.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        // Lấy danh sách quyền hạn của người dùng vừa đăng nhập
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        // Biến kiểm tra quyền Quản trị
        boolean isAdmin = false;

        for (GrantedAuthority authority : authorities) {
            String role = authority.getAuthority().toUpperCase(); // Đảm bảo đồng bộ IN HOA
            // Kiểm tra các Role có tiền tố ROLE_ADMIN (VD: ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_ADMIN_SUPER)
            // hoặc chứa từ khóa ADMIN / SUPERADMIN
            if (role.contains("ADMIN")) {
                isAdmin = true;
                break;
            }
        }

        // Điều hướng thông minh dựa vào nhóm quyền
        if (isAdmin) {
            // Đối với Quản trị viên (Super Admin, Admin con) -> Vào màn hình trang quản trị
            response.sendRedirect("/admin/dashboard");
        } else {
            // Mặc định đối với Sinh viên, Mentor hoặc Khách -> Về màn hình chính (Client Home)
            response.sendRedirect("/home");
        }
    }
}