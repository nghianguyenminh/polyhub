package com.polyhub.entity;

import jakarta.persistence.*;
<<<<<<< HEAD
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "posts") // Changed to lowercase
public class Post {
=======
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

>>>>>>> origin/appmod/java-upgrade-20260406032344
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

<<<<<<< HEAD
    @Column(columnDefinition = "TEXT") // Changed for MySQL compatibility
    private String content;

    private String image;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at")
    private Date createdAt = new Date();

    private int likes;

    private int comments;

    @ManyToOne
    @JoinColumn(name = "username")
    private User user;

}
=======
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(length = 1000)
    private String imageUrl;

    @Column(length = 255)
    private String imagePublicId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "username", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
>>>>>>> origin/appmod/java-upgrade-20260406032344
