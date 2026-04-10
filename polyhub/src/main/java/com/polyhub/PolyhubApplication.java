package com.polyhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync // Bật tính năng chạy bất đồng bộ (chủ yếu dùng gửi Email ko bị đơ website)
public class PolyhubApplication {

	public static void main(String[] args) {
		SpringApplication.run(PolyhubApplication.class, args);
	}

}
