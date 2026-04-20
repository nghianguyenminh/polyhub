package com.polyhub.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Roles")
public class Role implements Serializable {
    @Id
    @Column(length = 20)
    private String id; // Ví dụ: ADMIN_SUPER, STUDENT, MENTOR...

    @Column(columnDefinition = "nvarchar(50)", nullable = false)
    private String name; // Ví dụ: Quản trị viên cấp cao, Sinh viên...
}