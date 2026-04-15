 package com.polyhub.controller.client;

import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.User;
import com.polyhub.entity.RequestStatus;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.CategoryService;
import com.polyhub.service.CloudinaryService;
import com.polyhub.service.FileStorageService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class MentorController {

    private final CategoryService categoryService;
    private final MentorRequestRepository mentorRequestRepository;
    private final FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @GetMapping("/mentors")
    public String index(Model model) {
        model.addAttribute("categories", categoryService.getActiveCategoriesForDropdown());
        model.addAttribute("approvedMentors", mentorRequestRepository.findByStatus(RequestStatus.APPROVED));
        List<User> mentors = userRepository.findByRole_Id("MENTOR");
        model.addAttribute("mentors", mentors);
        return "client/mentors";
    }

    @GetMapping("/mentor-detail")
    public String mentorDetail(@RequestParam("id") Long id, Model model) {
        User mentor = userRepository.findById(id).orElse(null);

        if (mentor == null || !"MENTOR".equals(mentor.getRole().getId())) {
            return "redirect:/mentors"; // Or show an error page
        }
        model.addAttribute("mentor", mentor);
        return "client/mentor_detail";
    }

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
        if (mentorRequestRepository.existsByUserAndStatusNot(currentUser, MentorRequestStatus.REJECTED)) {
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
            MentorRequest request = new MentorRequest();
            request.setUser(currentUser);
            request.setFullname(fullname);
            request.setCccdNumber(cccdNumber);
            request.setEmail(email);
            request.setPhone(phone);
            request.setBirthday(birthday);
            request.setIntroduction(introduction);
            request.setMotivation(motivation);
            request.setStatus(MentorRequestStatus.PENDING);

            // Upload CV (Bắt buộc)
            if (!cvFile.isEmpty()) {
                Map<String, Object> uploadResult = fileStorageService.uploadFile(cvFile, "mentor");
                request.setCvFile(uploadResult.get("url").toString());
            } else {
                redirectAttributes.addFlashAttribute("error", "Vui lòng đính kèm CV nộp hồ sơ.");
                return "redirect:/mentors/register";
            }

            // Upload Chứng chỉ (Optional)
            if (certificateFile != null && !certificateFile.isEmpty()) {
                Map<String, Object> certResult = fileStorageService.uploadFile(certificateFile, "mentor");
                request.setCertificateFile(certResult.get("url").toString());
            }

            // Upload Bằng cấp (Optional)
            if (degreeFile != null && !degreeFile.isEmpty()) {
                Map<String, Object> degreeResult = fileStorageService.uploadFile(degreeFile, "mentor");
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
}