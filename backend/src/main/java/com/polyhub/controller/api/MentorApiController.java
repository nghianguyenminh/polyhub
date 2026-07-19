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
import com.polyhub.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Autowired
    private ReviewRepository reviewRepository;

    // Chỉ bật bằng application-dev.properties (app.mentor-test-bypass.enabled=true)
    // Mặc định là false để đảm bảo production luôn xác thực CCCD thật, không ai
    // có thể bypass chỉ bằng cách đặt tên file là "dummy.jpg".
    @Value("${app.mentor-test-bypass.enabled:false}")
    private boolean testBypassEnabled;

    @GetMapping
    public ResponseEntity<?> getMentors(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(required = false) String keyword,
            Principal principal) {

        Sort.Direction direction = "oldest".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page - 1, 4, Sort.by(direction, "createdAt"));

        // Nếu người dùng đang đăng nhập, loại chính họ ra khỏi danh sách mentor hiển
        // thị
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
            response.put("rejectionReason",
                    existingRequest.getRejectionReason() != null ? existingRequest.getRejectionReason() : "");
        } else {
            response.put("hasRequest", false);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerMentor(
            @RequestParam("fullname") String fullname,
            @RequestParam("cccdNumber") String cccdNumber,
            @RequestParam("cccdFrontFile") MultipartFile cccdFrontFile,
            @RequestParam("cccdBackFile") MultipartFile cccdBackFile,
            @RequestParam("email") String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam("birthday") String birthdayStr,
            @RequestParam("introduction") String introduction,
            @RequestParam("motivation") String motivation,
            @RequestParam("cvFile") MultipartFile cvFile,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile,
            @RequestParam(value = "degreeFile", required = false) MultipartFile degreeFile,
            @RequestParam("faceFile") MultipartFile faceFile,
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
        if (request.getId() != null
                && (request.getStatus() == RequestStatus.PENDING || request.getStatus() == RequestStatus.APPROVED)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Bạn đã có yêu cầu đăng ký đang xử lý hoặc đã được duyệt."));
        }

        try {
            // Xác thực CCCD qua FPT.AI.
            // Nhánh bypass (dummy.jpg) CHỈ hoạt động khi testBypassEnabled = true
            // (bật qua app.mentor-test-bypass.enabled trong application-dev.properties).
            // Ở production, biến này mặc định false => luôn gọi FPT.AI thật,
            // không ai có thể qua mặt xác thực chỉ bằng cách đặt tên file "dummy.jpg".
            com.fasterxml.jackson.databind.JsonNode ocrResult;
            boolean isDummyUpload = cccdFrontFile != null && "dummy.jpg".equals(cccdFrontFile.getOriginalFilename());

            if (testBypassEnabled && isDummyUpload) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.node.ObjectNode mockResult = mapper.createObjectNode();
                mockResult.put("errorCode", 0);
                mockResult.put("errorMessage", "success");

                com.fasterxml.jackson.databind.node.ObjectNode mockData = mapper.createObjectNode();
                mockData.put("id", cccdNumber);
                mockData.put("name", fullname);
                try {
                    LocalDate inputBirthdayForMock = LocalDate.parse(birthdayStr);
                    java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
                    mockData.put("dob", inputBirthdayForMock.format(dtf));
                } catch (Exception e) {
                    mockData.put("dob", "15/08/1999");
                }
                mockData.put("copy_check", "real");
                mockData.put("fake_check", "real");
                mockData.put("recaptured_check", "real");

                mockResult.putArray("data").add(mockData);
                ocrResult = mockResult;
            } else {
                ocrResult = fptAiService.extractCccdDetails(cccdFrontFile);
            }

            int errorCode = ocrResult.path("errorCode").asInt(-1);
            if (errorCode != 0) {
                String errorMsg = ocrResult.path("errorMessage").asText("Lỗi không xác định");
                return ResponseEntity.badRequest().body(Map.of("error", "FPT.AI OCR Error: " + errorMsg));
            }

            com.fasterxml.jackson.databind.JsonNode dataArray = ocrResult.path("data");
            if (!dataArray.isArray() || dataArray.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Không thể trích xuất thông tin trên thẻ CCCD"));
            }

            com.fasterxml.jackson.databind.JsonNode ocrData = dataArray.get(0);
            String extractedCccd = ocrData.path("id").asText();
            String extractedName = ocrData.path("name").asText();
            String extractedDob = ocrData.path("dob").asText(); // định dạng DD/MM/YYYY

            // Kiểm tra chống giả mạo (Anti-spoofing)
            String copyCheck = ocrData.path("copy_check").asText("real");
            String fakeCheck = ocrData.path("fake_check").asText("real");
            String recapturedCheck = ocrData.path("recaptured_check").asText("real");

            if ("photo".equalsIgnoreCase(copyCheck)) {
                return ResponseEntity.badRequest().body(Map.of("error",
                        "Đăng ký thất bại: Phát hiện ảnh CCCD là ảnh photocopy. Vui lòng chụp ảnh gốc."));
            }
            if ("fake".equalsIgnoreCase(fakeCheck)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Đăng ký thất bại: Phát hiện cấu trúc thẻ CCCD giả mạo."));
            }
            if ("screen_recaptured".equalsIgnoreCase(recapturedCheck)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Đăng ký thất bại: Phát hiện ảnh CCCD được chụp lại từ màn hình khác."));
            }

            // Đối chiếu chéo thông tin nhập vào với kết quả OCR
            // Đối chiếu số CCCD
            if (!extractedCccd.trim().equalsIgnoreCase(cccdNumber.replace(" ", ""))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Số CCCD nhập vào không khớp với thông tin trên ảnh thẻ."));
            }

            // Đối chiếu Họ tên
            String normInputName = fullname.trim().replaceAll("\\s+", " ").toUpperCase();
            String normExtractedName = extractedName.trim().replaceAll("\\s+", " ").toUpperCase();
            if (!normInputName.equalsIgnoreCase(normExtractedName)) {
                String cleanInputName = removeAccent(normInputName);
                String cleanExtractedName = removeAccent(normExtractedName);
                if (!cleanInputName.equalsIgnoreCase(cleanExtractedName)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Họ tên nhập vào không khớp với tên trên thẻ CCCD."));
                }
            }

            // Đối chiếu ngày sinh
            LocalDate inputBirthday = LocalDate.parse(birthdayStr);
            String[] dobParts = extractedDob.split("/");
            if (dobParts.length == 3) {
                try {
                    int day = Integer.parseInt(dobParts[0]);
                    int month = Integer.parseInt(dobParts[1]);
                    int year = Integer.parseInt(dobParts[2]);
                    LocalDate extractedBirthday = LocalDate.of(year, month, day);
                    if (!inputBirthday.equals(extractedBirthday)) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Ngày sinh nhập vào không khớp với ngày sinh trên thẻ CCCD."));
                    }
                } catch (Exception e) {
                    // Dùng dữ liệu đầu vào làm mặc định nếu OCR bị lỗi định dạng ngày sinh
                }
            }

            request.setUser(currentUser);
            request.setFullname(fullname);
            request.setCccdNumber(extractedCccd);
            request.setEmail(email);
            request.setPhone(phone);
            request.setBirthday(inputBirthday);
            request.setIntroduction(introduction);
            request.setMotivation(motivation);
            request.setStatus(RequestStatus.PENDING);
            request.setRejectionReason(null);

            // Upload files concurrently to speed up the process
            java.util.concurrent.CompletableFuture<String> frontUpload = (cccdFrontFile != null
                    && !cccdFrontFile.isEmpty())
                            ? java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                                try {
                                    return fileStorageService.uploadFile(cccdFrontFile).get("url").toString();
                                } catch (Exception e) {
                                    return null;
                                }
                            })
                            : java.util.concurrent.CompletableFuture.completedFuture(null);

            java.util.concurrent.CompletableFuture<String> backUpload = (cccdBackFile != null
                    && !cccdBackFile.isEmpty())
                            ? java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                                try {
                                    return fileStorageService.uploadFile(cccdBackFile).get("url").toString();
                                } catch (Exception e) {
                                    return null;
                                }
                            })
                            : java.util.concurrent.CompletableFuture.completedFuture(null);

            java.util.concurrent.CompletableFuture<String> faceUpload = (faceFile != null && !faceFile.isEmpty())
                    ? java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                        try {
                            return fileStorageService.uploadFile(faceFile).get("url").toString();
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    : java.util.concurrent.CompletableFuture.completedFuture(null);

            java.util.concurrent.CompletableFuture<String> cvUpload = (cvFile != null && !cvFile.isEmpty())
                    ? java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                        try {
                            return fileStorageService.uploadFile(cvFile).get("url").toString();
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    : java.util.concurrent.CompletableFuture.completedFuture(request.getCvFile());

            java.util.concurrent.CompletableFuture<String> certUpload = (certificateFile != null
                    && !certificateFile.isEmpty())
                            ? java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                                try {
                                    return fileStorageService.uploadFile(certificateFile).get("url").toString();
                                } catch (Exception e) {
                                    return null;
                                }
                            })
                            : java.util.concurrent.CompletableFuture.completedFuture(null);

            java.util.concurrent.CompletableFuture<String> degreeUpload = (degreeFile != null && !degreeFile.isEmpty())
                    ? java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                        try {
                            return fileStorageService.uploadFile(degreeFile).get("url").toString();
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    : java.util.concurrent.CompletableFuture.completedFuture(null);

            // Wait for all uploads to complete
            java.util.concurrent.CompletableFuture
                    .allOf(frontUpload, backUpload, faceUpload, cvUpload, certUpload, degreeUpload).join();

            if (frontUpload.join() != null)
                request.setCccdFrontFile(frontUpload.join());
            if (backUpload.join() != null)
                request.setCccdBackFile(backUpload.join());
            if (faceUpload.join() != null)
                request.setFaceFile(faceUpload.join());

            String cvUrl = cvUpload.join();
            if (cvUrl != null && !cvUrl.isEmpty()) {
                request.setCvFile(cvUrl);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Vui lòng đính kèm CV nộp hồ sơ."));
            }

            if (certUpload.join() != null)
                request.setCertificateFile(certUpload.join());
            if (degreeUpload.join() != null)
                request.setDegreeFile(degreeUpload.join());
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
        map.put("faceFile", m.getFaceFile());
        map.put("createdAt", m.getCreatedAt());

        Double avgRating = 0.0;
        Long revCount = 0L;

        if (m.getUser() != null) {
            avgRating = reviewRepository.getAverageRatingForMentor(m.getUser());
            revCount = reviewRepository.countReviewsForMentor(m.getUser());

            map.put("user", Map.of(
                    "username", m.getUser().getUsername(),
                    "avatar", m.getUser().getAvatar() != null ? m.getUser().getAvatar() : "",
                    "major", m.getUser().getMajor() != null ? m.getUser().getMajor() : ""));
        }

        map.put("averageRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
        map.put("reviewCount", revCount != null ? revCount : 0);

        return map;
    }

    private String removeAccent(String str) {
        String temp = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD);
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(temp).replaceAll("").replace("Đ", "D").replace("đ", "d");
    }
}