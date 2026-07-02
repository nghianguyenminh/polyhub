package com.polyhub.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseMigrationConfig {
    @Bean
    public CommandLineRunner migrateDatabase(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Sửa kiểu dữ liệu cột status từ ENUM (mặc định của MySQL) sang VARCHAR(50)
                // Để tránh lỗi DataTruncation khi thêm các trạng thái mới (INTERVIEWING, NEEDS_UPDATE...)
                jdbcTemplate.execute("ALTER TABLE mentor_requests MODIFY COLUMN status VARCHAR(50);");
                System.out.println("[PolyHUB - DB Migration] Đã chuyển đổi cột status sang VARCHAR(50) thành công!");
            } catch (Exception e) {
                // Bỏ qua lỗi nếu cột đã là VARCHAR hoặc bảng chưa được tạo
                System.out.println("[PolyHUB - DB Migration] Bỏ qua thao tác (Cột đã được cập nhật hoặc bảng chưa tồn tại).");
            }
        };
    }
}
