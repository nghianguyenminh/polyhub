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

        // Biến kiểm tra điều hướng cơ bản
        boolean isAdmin = false;

        for (GrantedAuthority authority : authorities) {
            String role = authority.getAuthority();
            // Nếu người dùng có quyền Quản trị viên (có thể điều chỉnh tuỳ vào Data của bạn)
            if (role.equals("ROLE_ADMIN") || role.equals("ROLE_ADMIN_SUPER")) {
                isAdmin = true;
                break;
            }
        }

        // Điều hướng tương ứng sau khi đăng nhập thành công
        if (isAdmin) {
            response.sendRedirect("/admin/dashboard");
        } else {
            // Mặc định đối với Sinh viên (ROLE_STUDENT) hoặc người dùng thường thì về Home
            response.sendRedirect("/home"); // Có thể đổi lại url này nếu bạn có url trang chủ khác
        }
    }
}