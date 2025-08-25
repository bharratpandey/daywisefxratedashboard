package org.example.daywisefxratedashboard.jobs;

import org.example.daywisefxratedashboard.service.ExchangeRateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

@Component
public class DailyFxIngestJob {
    private static final Logger log = LoggerFactory.getLogger(DailyFxIngestJob.class);
    private final ExchangeRateService service;

    public DailyFxIngestJob(ExchangeRateService service) {
        this.service = service;
    }

    /**
     * Runs every day at 06:40 AM IST.
     * Cron format: second minute hour day month dayOfWeek
     */
    @Scheduled(cron = "0 40 6 * * *", zone = "Asia/Kolkata")
    public void runDaily() {
        LocalDate todayIst = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        log.info("Scheduled ingest starting for {}", todayIst);
        int count = service.ingestForDate(todayIst);
        log.info("Scheduled ingest finished for {} — saved {} rows.", todayIst, count);
    }
}
