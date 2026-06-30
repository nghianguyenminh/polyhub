package com.polyhub.controller.api;

import com.polyhub.entity.Category;
import com.polyhub.entity.MentorRequest;
import com.polyhub.entity.RequestStatus;
import com.polyhub.entity.User;
import com.polyhub.repository.MentorRequestRepository;
import com.polyhub.repository.UserRepository;
import com.polyhub.service.CategoryService;
import com.polyhub.service.FileStorageService;
import com.polyhub.service.FptAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mentors")
public class MentorApiController {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private MentorRequestRepository mentorRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private FptAiService fptAiService;

    @GetMapping
    public ResponseEntity<?> getMentors(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "newest") String sort,
        @RequestParam(required = false) String keyword,
        Principal principal) {

    Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(page - 1, 4, Sort.by(direction, "createdAt"));

    // Nếu người dùng đang đăng nhập, loại chính họ ra khỏi danh sách mentor hiển thị
    String currentUsername = principal != null ? principal.getName() : null;

    Page<MentorRequest> mentorPage;
    if (keyword != null && !keyword.trim().isEmpty()) {
        mentorPage = mentorRequestRepository.findByStatusAndKeywordExcludingUser(
                RequestStatus.APPROVED, keyword.trim(), currentUsername, pageable);
    } else {
        mentorPage = mentorRequestRepository.findByStatusExcludingUser(
                RequestStatus.APPROVED, currentUsername, pageable);
    }

        List<Map<String, Object>> mentorsList = mentorPage.getContent().stream()
                .map(m -> buildMentorMap(m))
                .collect(Collectors.toList());

        List<Category> categories = categoryService.getActiveCategoriesForDropdown();
        List<Map<String, Object>> categoriesList = categories.stream()
                .map(cat -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", cat.getId());
                    m.put("name", cat.getName());
                    m.put("code", cat.getCode());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("mentors", mentorsList);
        response.put("categories", categoriesList);
        response.put("currentPage", mentorPage.getNumber() + 1);
        response.put("totalPages", mentorPage.getTotalPages());
        response.put("totalElements", mentorPage.getTotalElements());
        response.put("sort", sort);
        response.put("keyword", keyword != null ? keyword.trim() : "");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<?> getRegistrationStatus(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Chưa đăng nhập"));
        }

        User currentUser = userRepository.findById(principal.getName()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Người dùng không tồn tại"));
        }

        boolean isMentor = currentUser.getRole() != null && "MENTOR".equalsIgnoreCase(currentUser.getRole().getId());
        MentorRequest existingRequest = mentorRequestRepository.findByUser(currentUser).orElse(null);

        Map<String, Object> response = new HashMap<>();
        response.put("isMentor", isMentor);
        if (existingRequest != null) {
            response.put("hasRequest", true);
            response.put("requestId", existingRequest.getId());
            response.put("requestStatus", existingRequest.getStatus().toString());
            response.put("rejectionReason", existingRequest.getRejectionReason() != null ? existingRequest.getRejectionReason() : "");
        } else {
            response.put("hasRequest", false);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerMentor(
            @RequestParam("fullname") String fullname,
            @RequestParam("cccdFrontFile") MultipartFile cccdFrontFile,
            @RequestParam("cccdBackFile") MultipartFile cccdBackFile,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("birthday") String birthdayStr,
            @RequestParam("introduction") String introduction,
            @RequestParam("motivation") String motivation,
            @RequestParam("cvFile") MultipartFile cvFile,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile,
            @RequestParam(value = "degreeFile", required = false) MultipartFile degreeFile,
            Principal principal) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Vui lòng đăng nhập để nộp hồ sơ"));
        }

        User currentUser = userRepository.findById(principal.getName()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Người dùng không tồn tại"));
        }

        if (currentUser.getRole() != null && "MENTOR".equalsIgnoreCase(currentUser.getRole().getId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã là Mentor rồi, không cần đăng ký thêm."));
        }

        MentorRequest request = mentorRequestRepository.findByUser(currentUser).orElse(new MentorRequest());
        if (request.getId() != null && (request.getStatus() == RequestStatus.PENDING || request.getStatus() == RequestStatus.APPROVED)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã có yêu cầu đăng ký đang xử lý hoặc đã được duyệt."));
        }

        try {
            // Xác thực CCCD qua FPT.AI
            String extractedCccdNumber = fptAiService.extractCccdNumber(cccdFrontFile);

            LocalDate birthday = LocalDate.parse(birthdayStr);
            request.setUser(currentUser);
            request.setFullname(fullname);
            request.setCccdNumber(extractedCccdNumber);
            request.setEmail(email);
            request.setPhone(phone);
            request.setBirthday(birthday);
            request.setIntroduction(introduction);
            request.setMotivation(motivation);
            request.setStatus(RequestStatus.PENDING);
            request.setRejectionReason(null);

            // Upload CCCD images
            if (cccdFrontFile != null && !cccdFrontFile.isEmpty()) {
                Map<String, Object> frontResult = fileStorageService.uploadFile(cccdFrontFile);
                request.setCccdFrontFile(frontResult.get("url").toString());
            }
            if (cccdBackFile != null && !cccdBackFile.isEmpty()) {
                Map<String, Object> backResult = fileStorageService.uploadFile(cccdBackFile);
                request.setCccdBackFile(backResult.get("url").toString());
            }

            // Upload CV (Required)
            if (cvFile != null && !cvFile.isEmpty()) {
                Map<String, Object> uploadResult = fileStorageService.uploadFile(cvFile);
                request.setCvFile(uploadResult.get("url").toString());
            } else if (request.getCvFile() == null || request.getCvFile().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng đính kèm CV nộp hồ sơ."));
            }

            // Upload Certificate (Optional)
            if (certificateFile != null && !certificateFile.isEmpty()) {
                Map<String, Object> certResult = fileStorageService.uploadFile(certificateFile);
                request.setCertificateFile(certResult.get("url").toString());
            }

            // Upload Degree (Optional)
            if (degreeFile != null && !degreeFile.isEmpty()) {
                Map<String, Object> degreeResult = fileStorageService.uploadFile(degreeFile);
                request.setDegreeFile(degreeResult.get("url").toString());
            }
            mentorRequestRepository.save(request);
            return ResponseEntity.ok(Map.of("message", "Gửi yêu cầu thành công! Vui lòng chờ BQT phê duyệt."));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Đã xảy ra lỗi: " + e.getMessage()));
        }

    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMentorDetail(@PathVariable("id") Long id) {
        MentorRequest mentor = mentorRequestRepository.findById(id).orElse(null);
        if (mentor == null || mentor.getStatus() != RequestStatus.APPROVED) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Không tìm thấy thông tin Mentor"));
        }
        return ResponseEntity.ok(buildMentorMap(mentor));
    }

    private Map<String, Object> buildMentorMap(MentorRequest m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("fullname", m.getFullname());
        map.put("email", m.getEmail());
        map.put("phone", m.getPhone());
        map.put("birthday", m.getBirthday());
        map.put("introduction", m.getIntroduction());
        map.put("motivation", m.getMotivation());
        map.put("cvFile", m.getCvFile());
        map.put("certificateFile", m.getCertificateFile());
        map.put("degreeFile", m.getDegreeFile());
        map.put("createdAt", m.getCreatedAt());
        if (m.getUser() != null) {
            map.put("user", Map.of(
                    "username", m.getUser().getUsername(),
                    "avatar", m.getUser().getAvatar() != null ? m.getUser().getAvatar() : "",
                    "major", m.getUser().getMajor() != null ? m.getUser().getMajor() : ""
            ));
        }
        return map;
    }
}
