package com.polyhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync // Bật tính năng chạy bất đồng bộ (chủ yếu dùng gửi Email ko bị đơ website)
@EnableScheduling // Kích hoạt tính năng scheduled tasks chạy ngầm định kỳ
public class PolyhubApplication {

	public static void main(String[] args) {
		SpringApplication.run(PolyhubApplication.class, args);
	}

}
