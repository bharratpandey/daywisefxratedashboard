package org.example.daywisefxratedashboard;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.stereotype.Component;

@SpringBootApplication
@EnableScheduling
public class FxDashboardApplication {
    public static void main(String[] args) {
        SpringApplication.run(FxDashboardApplication.class, args);
    }
}

/**
 * Logs datasource URL at startup so you can confirm env vars are being picked up.
 */
@Component
class StartupLog {
    private static final Logger log = LoggerFactory.getLogger(StartupLog.class);

    @Value("${spring.datasource.url:}")
    private String dsUrl;

    @Value("${spring.datasource.username:}")
    private String dsUser;

    @PostConstruct
    void show() {
        log.info(">>> spring.datasource.url = {}", (dsUrl == null || dsUrl.isBlank()) ? "<empty>" : dsUrl);
        log.info(">>> spring.datasource.username = {}", (dsUser == null || dsUser.isBlank()) ? "<empty>" : dsUser);
    }
}
