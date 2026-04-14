package com.polyhub.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User implements Serializable {

    @Id
    private String username; // Tên đăng nhập (ID)

    private String password;

    private String fullname;

    private String email;

    private String phone;

    private Boolean gender = true; // True: Nam, False: Nữ

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthday;

    private String major; // Chuyên ngành

    private String avatar = "default.png";

    // Ảnh bìa
    private String coverImage = "default-cover.jpg";

    private String bio;

    private String school;

    private String address;

    private Boolean active = true; // Trạng thái hoạt động

    private LocalDateTime createdAt = LocalDateTime.now();

    private Boolean wantsToBecomeMentor = false;

    private String mentorMajor;

    private Double gpa;

    private String rejectionReason;

    private String mentorReason;

    private List<String> mentorSkills;

    private String evidenceLink;

    private String evidenceName;

    // --- KẾT NỐI VỚI BẢNG ROLE ---
    private String roleId;
}
