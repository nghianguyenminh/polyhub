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
        
        org.springframework.data.domain.Page<MentorRequest> mentorPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            mentorPage = mentorRequestRepository.findByStatusAndKeyword(RequestStatus.APPROVED, keyword.trim(), pageable);
            model.addAttribute("keyword", keyword.trim());
        } else {
            mentorPage = mentorRequestRepository.findByStatus(RequestStatus.APPROVED, pageable);
        }
        
        model.addAttribute("categories", categoryService.getActiveCategoriesForDropdown());
        model.addAttribute("approvedMentors", mentorPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", mentorPage.getTotalPages());
        model.addAttribute("currentSort", sort);
        return "client/mentors"; // Mở file src/main/resources/templates/client/mentors.html
    }s

    @GetMapping("/mentors/register")
    public String registerForm(@ModelAttribute("currentUser") User currentUser, Model model, RedirectAttributes redirectAttributes) {
        if (currentUser == null) {
            return "redirect:/login"; // Bắt buộc đăng nhập
        }
        
        // Kiểm tra nếu User đã là Mentor
        if (currentUser.getRole() != null && "MENTOR".equalsIgnoreCase(currentUser.getRole().getId())) {
            redirectAttributes.addFlashAttribute("error", "Bạn đã là Mentor rồi, không cần đăng ký thêm.");
            return "redirect:/mentors";
        }
        
        // Kiểm tra user có đơn đăng ký đang chờ hoặc đã duyệt chưa
        MentorRequest existingRequest = mentorRequestRepository.findByUser(currentUser).orElse(null);
        if (existingRequest != null && (existingRequest.getStatus() == RequestStatus.PENDING || existingRequest.getStatus() == RequestStatus.APPROVED)) {
            redirectAttributes.addFlashAttribute("error", "Bạn đã có một yêu cầu đăng ký đang được xử lý hoặc đã được duyệt.");
            return "redirect:/mentors";
        }
        
        model.addAttribute("user", currentUser);
        return "client/mentor_register"; // Mở file form wizard
    }

    @PostMapping("/mentors/register")
    public String registerSubmit(
            @ModelAttribute("currentUser") User currentUser,
            @RequestParam("fullname") String fullname,
            @RequestParam("cccdNumber") String cccdNumber,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("birthday") String birthdayStr,
            @RequestParam("introduction") String introduction,
            @RequestParam("motivation") String motivation,
            @RequestParam("cvFile") MultipartFile cvFile,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile,
            @RequestParam(value = "degreeFile", required = false) MultipartFile degreeFile,
            RedirectAttributes redirectAttributes) {
            
        if (currentUser == null) {
            return "redirect:/login";
        }

        try {
            LocalDate birthday = LocalDate.parse(birthdayStr);
            // Cập nhật lại request cũ thay vì tạo mới để tránh Spam Row trong CS dữ liệu
            MentorRequest request = mentorRequestRepository.findByUser(currentUser).orElse(new MentorRequest());
            
            // Re-check để chặn user Submit nhiều tab cùng lúc
            if (request.getId() != null && (request.getStatus() == RequestStatus.PENDING || request.getStatus() == RequestStatus.APPROVED)) {
                redirectAttributes.addFlashAttribute("error", "Bạn đã có yêu cầu đăng ký đang xử lý.");
                return "redirect:/mentors";
            }

            request.setUser(currentUser);
            request.setFullname(fullname);
            request.setCccdNumber(cccdNumber);
            request.setEmail(email);
            request.setPhone(phone);
            request.setBirthday(birthday);
            request.setIntroduction(introduction);
            request.setMotivation(motivation);
            request.setStatus(RequestStatus.PENDING);
            request.setRejectionReason(null); // Reset lại lý do từ chối cũ

            // Upload CV (Bắt buộc)
            if (cvFile != null && !cvFile.isEmpty()) {
                Map<String, Object> uploadResult = fileStorageService.uploadFile(cvFile);
                request.setCvFile(uploadResult.get("url").toString());
            } else if (request.getCvFile() == null || request.getCvFile().isEmpty()) {
                redirectAttributes.addFlashAttribute("error", "Vui lòng đính kèm CV nộp hồ sơ.");
                return "redirect:/mentors/register";
            }

            // Upload Chứng chỉ (Optional)
            if (certificateFile != null && !certificateFile.isEmpty()) {
                Map<String, Object> certResult = fileStorageService.uploadFile(certificateFile);
                request.setCertificateFile(certResult.get("url").toString());
            }

            // Upload Bằng cấp (Optional)
            if (degreeFile != null && !degreeFile.isEmpty()) {
                Map<String, Object> degreeResult = fileStorageService.uploadFile(degreeFile);
                request.setDegreeFile(degreeResult.get("url").toString());
            }

            mentorRequestRepository.save(request);
            redirectAttributes.addFlashAttribute("success", "Gửi yêu cầu thành công! Vui lòng chờ BQT phê duyệt.");
            return "redirect:/mentors";

        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("error", "Đã xảy ra lỗi trong quá trình đẩy hồ sơ: " + e.getMessage());
            return "redirect:/mentors/register";
        }
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
