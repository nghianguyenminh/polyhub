package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller xử lý các yêu cầu liên quan đến trang Video của PolyHUB.
 * Đảm bảo các video từ sinh viên được hiển thị đúng layout.
 */
@Controller
@RequestMapping("/videos")
public class VideoController {

    /**
     * Hiển thị trang danh sách video (Video Feed).
     * @param model Đối tượng cung cấp dữ liệu cho giao diện Thymeleaf.
     * @return Đường dẫn tới file template HTML.
     */
    @GetMapping
    public String index(Model model) {
        // Thiết lập tiêu đề trang
        model.addAttribute("pageTitle", "Video Sinh Viên - PolyHUB");
        
        // Sau này Thịnh sẽ gọi Service để lấy danh sách video từ Database ở đây
        // Ví dụ: model.addAttribute("listVideos", videoService.findAll());

        // Trả về file videos.html trong thư mục templates/client/
        return "client/videos";
    }

    /**
     * Hiển thị chi tiết một video cụ thể (nếu cần).
     * @return Đường dẫn tới file chi tiết video.
     */
    @GetMapping("/detail")
    public String detail() {
        return "client/video-detail";
    }
}