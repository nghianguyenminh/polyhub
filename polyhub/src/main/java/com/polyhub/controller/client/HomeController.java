package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index() {
        return "client/home"; // Nó sẽ tìm file src/main/resources/templates/client/home.html
    }
}