package com.polyhub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean("summaryTaskExecutor")
    public Executor summaryTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);     // 2 luồng thường trực
        executor.setMaxPoolSize(4);      // Tối đa 4 luồng khi cao điểm
        executor.setQueueCapacity(50);   // Hàng đợi tối đa 50 tài liệu
        executor.setThreadNamePrefix("doc-summary-");
        executor.initialize();
        return executor;
    }
}
