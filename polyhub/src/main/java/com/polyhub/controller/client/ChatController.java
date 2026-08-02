package com.polyhub.controller.client;

@org.springframework.stereotype.Controller
public class ChatController {

    @GetMapping("/chat")
    public String chatPage() {
        // Trả về file chat.html trong thư mục templates
        return "client/chat";
    }
}