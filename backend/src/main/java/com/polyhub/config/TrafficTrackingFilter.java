package com.polyhub.config;

import com.polyhub.entity.VisitorLog;
import com.polyhub.repository.VisitorLogRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDate;

@Component
public class TrafficTrackingFilter implements Filter {

    @Autowired
    private VisitorLogRepository visitorLogRepository;

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) 
            throws IOException, ServletException {
        
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        String path = request.getRequestURI();

        // Track only client-facing APIs, exclude static files or dashboard requests
        if (path.startsWith("/api/") && !path.startsWith("/api/admin/")) {
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            }
            if (ip != null && ip.contains(",")) {
                ip = ip.split(",")[0].trim();
            }

            if (ip != null && !ip.isEmpty()) {
                LocalDate today = LocalDate.now();
                
                // Avoid DB write exception spam by checking if it exists first
                if (!visitorLogRepository.existsByIpAddressAndAccessDate(ip, today)) {
                    try {
                        visitorLogRepository.save(new VisitorLog(ip, today));
                    } catch (DataIntegrityViolationException e) {
                        // Safe to ignore: concurrent request registered this IP for today
                    } catch (Exception e) {
                        // Safe to ignore: don't crash standard application requests if logging fails
                        System.err.println("Failed to log visitor access: " + e.getMessage());
                    }
                }
            }
        }

        filterChain.doFilter(servletRequest, servletResponse);
    }
}
