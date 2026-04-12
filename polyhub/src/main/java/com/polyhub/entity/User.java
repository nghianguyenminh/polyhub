package com.polyhub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Users")
public class User implements Serializable {

  @Id
  @Column(length = 20)
  private String username; // Tên đăng nhập (ID)

  @Column(nullable = false)
  private String password;

  @Column(columnDefinition = "VARCHAR(100)", nullable = false)
  private String fullname;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(length = 15)
  private String phone;

  private Boolean gender = true; // True: Nam, False: Nữ

  @DateTimeFormat(pattern = "yyyy-MM-dd")
  private LocalDate birthday;

  @Column(columnDefinition = "nvarchar(100)")
  private String major; // Chuyên ngành

  private String avatar = "default.png";

  // Ảnh bìa
  private String coverImage = "default-cover.jpg";

  @Column(columnDefinition = "TEXT")
  private String bio;

  @Column(columnDefinition = "VARCHAR(255)")
  private String school;

  @Column(columnDefinition = "VARCHAR(255)")
  private String address;

  private Boolean active = true; // Trạng thái hoạt động

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  private Boolean wantsToBecomeMentor = false;

  private String mentorMajor;

  private Double gpa;

  private String rejectionReason;

  private String mentorReason;

  @ElementCollection
  private List<String> mentorSkills;

  private String evidenceLink;

  private String evidenceName;

  // --- KẾT NỐI VỚI BẢNG ROLE ---
  @ManyToOne
  @JoinColumn(name = "role_id")
  private Role role;
}