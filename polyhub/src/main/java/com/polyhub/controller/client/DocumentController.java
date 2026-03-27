package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DocumentController {
    @GetMapping("/documents")
    public String index() {
        return "client/documents"; 
    } 
}
