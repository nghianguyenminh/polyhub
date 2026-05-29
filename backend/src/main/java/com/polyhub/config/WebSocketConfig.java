package com.polyhub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Nơi Client lắng nghe nhận tin (Subscribes).
        // `/topic` dùng cho phòng chung, `/user` dùng cho phòng riêng tư 1-1
        config.enableSimpleBroker("/topic", "/user");
        
        // Client khi muốn gửi tin nhắn lên Server thì đường dẫn phải bắt đầu bằng `/app`
        config.setApplicationDestinationPrefixes("/app");
        
        // Khai báo prefix định tuyến cho các kênh private cá nhân
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Khai báo trạm kết nối chính cho Client (Trình duyệt) truy cập
        // `.withSockJS()` giúp tương thích chéo, trường hợp trình duyệt cũ ko hỗ trợ chuẩn WebSockets
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
