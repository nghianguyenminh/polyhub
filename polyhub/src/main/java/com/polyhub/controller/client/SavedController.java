package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SavedController {
    @GetMapping("/saved")
    public String getSaved() {
        return "client/saved";
    }
}
