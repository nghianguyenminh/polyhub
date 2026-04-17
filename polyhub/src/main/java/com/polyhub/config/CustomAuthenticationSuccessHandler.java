package com.polyhub.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collection;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request,
      HttpServletResponse response,
      Authentication authentication) throws IOException, ServletException {
    // Lấy danh sách các quyền của người dùng
    Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

    // Chuyển hướng người dùng dựa trên quyền
    authorities.forEach(authority -> {
      try {
        if (authority.getAuthority().equals("ROLE_ADMIN")) {
          response.sendRedirect("/admin/dashboard"); // Chuyển hướng đến trang admin
        } else if (authority.getAuthority().equals("ROLE_USER")) {
          response.sendRedirect("/"); // Chuyển hướng đến trang user
        } else {
          response.sendRedirect("/"); // Mặc định chuyển hướng đến trang user
        }
      } catch (IOException e) {
        // Handle the exception, perhaps by logging it
        e.printStackTrace();
      }
    });
  }
}
