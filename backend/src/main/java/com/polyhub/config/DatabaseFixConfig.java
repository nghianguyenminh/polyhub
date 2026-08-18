// package com.polyhub.config;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.jdbc.core.JdbcTemplate;

// @Configuration
// public class DatabaseFixConfig implements CommandLineRunner {

//     @Autowired
//     private JdbcTemplate jdbcTemplate;

//     @Override
//     public void run(String... args) throws Exception {
//         // Bước 1: Drop FK constraint trước
//         try {
//             jdbcTemplate.execute("ALTER TABLE notifications DROP FOREIGN KEY FKspons6y5c4jbo6bme16l9c9le;");
//             System.out.println("Successfully dropped FK constraint from 'notifications'.");
//         } catch (Exception e) {
//             System.out.println("FK might already be removed: " + e.getMessage());
//         }

//         // Bước 2: Sau đó mới drop cột username
//         try {
//             jdbcTemplate.execute("ALTER TABLE notifications DROP COLUMN username;");
//             System.out.println("Successfully dropped column 'username' from 'notifications' table.");
//         } catch (Exception e) {
//             System.out.println("Failed to drop column 'username' from 'notifications' table. It might already be removed: " + e.getMessage());
//         }
//     }
// }
