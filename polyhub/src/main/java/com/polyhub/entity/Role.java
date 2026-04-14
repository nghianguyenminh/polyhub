package com.polyhub.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "roles")
public class Role implements Serializable {
    @Id
    private String id; // Ví dụ: ADMIN_SUPER, STUDENT, MENTOR...

    private String name; // Ví dụ: Quản trị viên cấp cao, Sinh viên...
}