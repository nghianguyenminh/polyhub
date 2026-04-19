package com.polyhub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    // Đảm bảo cột password đủ dài để chứa chuỗi mã hóa
    @Column(nullable = false, length = 100)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String fullname;

    private String phone;

    private String address;

    private String avatar;

    @Column(name = "mentor_major")
    private String mentorMajor;

    @Column(name = "mentor_description", columnDefinition = "TEXT")
    private String mentorDescription;

<<<<<<< HEAD
    private String skills;

=======
    // Ảnh bìa
    private String coverImage = "default-cover.jpg";

    private Boolean active = true; // Trạng thái hoạt động

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Thêm biến này vào danh sách các thuộc tính
    @Column(columnDefinition = "NVARCHAR(500)")
    private String bio; 

    // --- KẾT NỐI VỚI BẢNG ROLE ---
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    private boolean gender;

    private LocalDate birthday;

    private boolean active;

    private boolean wantsToBecomeMentor;

    private String rejectionReason;

    public User() {
        this.createdAt = new Date();
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullname() {
        return fullname;
    }

    public void setFullname(String fullname) {
        this.fullname = fullname;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getMentorMajor() {
        return mentorMajor;
    }

    public void setMentorMajor(String mentorMajor) {
        this.mentorMajor = mentorMajor;
    }

    public String getMentorDescription() {
        return mentorDescription;
    }

    public void setMentorDescription(String mentorDescription) {
        this.mentorDescription = mentorDescription;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isGender() {
        return gender;
    }

    public void setGender(boolean gender) {
        this.gender = gender;
    }

    public LocalDate getBirthday() {
        return birthday;
    }

    public void setBirthday(LocalDate birthday) {
        this.birthday = birthday;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isWantsToBecomeMentor() {
        return wantsToBecomeMentor;
    }

    public void setWantsToBecomeMentor(boolean wantsToBecomeMentor) {
        this.wantsToBecomeMentor = wantsToBecomeMentor;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
