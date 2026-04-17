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
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, 
                                        Authentication authentication) throws IOException, ServletException {
        
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        // Default redirect URL if no specific role-based redirect is found
        String redirectUrl = "/?loginSuccess";

        if (authorities != null && !authorities.isEmpty()) {
            for (GrantedAuthority grantedAuthority : authorities) {
                String authorityName = grantedAuthority.getAuthority();

                // Prioritize redirect for higher-privileged roles
                if (authorityName.equals("ROLE_SUPER_ADMIN")) {
                    redirectUrl = "/admin/dashboard?role=super_admin";
                    break; // Exit loop once highest priority role is found
                } else if (authorityName.equals("ROLE_ADMIN")) {
                    redirectUrl = "/admin/dashboard?role=admin";
                    break; 
                } else if (authorityName.equals("ROLE_USER")) {
                    redirectUrl = "/?role=user";
                    // Don't break here, in case the user has higher roles
                }
            }
        }

        // Perform the redirect
        response.sendRedirect(request.getContextPath() + redirectUrl);
    }
}
