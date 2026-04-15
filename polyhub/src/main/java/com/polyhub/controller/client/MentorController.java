package com.polyhub.controller.client;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import com.polyhub.service.CategoryService;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class MentorController {
    
    private final CategoryService categoryService;

    @GetMapping("/mentors")
    public String index(Model model, 
                        @RequestParam(defaultValue = "1") int page,
                        @RequestParam(defaultValue = "newest") String sort) {
        // Phân trang 4 mentor/trang (2 dòng x 2 cột)
        org.springframework.data.domain.Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ?
                 org.springframework.data.domain.Sort.Direction.ASC : org.springframework.data.domain.Sort.Direction.DESC;
                 
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page - 1, 4, org.springframework.data.domain.Sort.by(direction, "createdAt"));
        
        org.springframework.data.domain.Page<MentorRequest> mentorPage = mentorRequestRepository.findByStatus(RequestStatus.APPROVED, pageable);
        
        model.addAttribute("categories", categoryService.getActiveCategoriesForDropdown());
        return "client/mentors"; // Mở file src/main/resources/templates/client/mentors.html
    }

    @GetMapping("/mentors/{id}")
    public String detail(@org.springframework.web.bind.annotation.PathVariable("id") Long id, Model model) {
        MentorRequest mentor = mentorRequestRepository.findById(id).orElse(null);
        if (mentor == null || mentor.getStatus() != RequestStatus.APPROVED) {
            return "redirect:/mentors";
        }
        model.addAttribute("mentor", mentor);
        return "client/mentor_detail"; // Mở file src/main/resources/templates/client/mentor_detail.html
    }
}
