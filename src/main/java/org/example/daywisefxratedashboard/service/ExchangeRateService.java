package org.example.daywisefxratedashboard.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.example.daywisefxratedashboard.model.ExchangeRate;
import org.example.daywisefxratedashboard.model.ExchangeRateId;
import org.example.daywisefxratedashboard.repo.ExchangeRateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
public class ExchangeRateService {

    private static final Logger log = LoggerFactory.getLogger(ExchangeRateService.class);

    private final ExchangeRateRepository repo;
    private final RestTemplate rest = new RestTemplate();

    @Value("${fx.daily.api}")
    private String dailyApi;

    public static final String SOURCE_DAILY = "DAILY";
    private static final List<String> FALLBACK_SYMBOLS = List.of("INR","EUR","AED","SAR");

    @PersistenceContext
    private EntityManager em;

    public ExchangeRateService(ExchangeRateRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<ExchangeRate> getRatesForDate(LocalDate date) {
        return repo.findAllById_RateDateAndId_Source(date, SOURCE_DAILY);
    }

    @Transactional
    public int ingestForDate(LocalDate date) {
        List<ExchangeRate> data = fetchDailyFromUpstream(date);
        if (data.isEmpty()) {
            log.warn("Primary returned 0 rows for {}. Trying fallback.", date);
            data = fetchFallbackFromExchangerateHost(date);
        }
        replaceDailyRates(date, data);
        log.info("Ingest for {} saved {} rows.", date, data.size());
        return data.size();
    }

    public List<ExchangeRate> fetchDailyFromUpstream(LocalDate targetDate) {
        try {
            ResponseEntity<UpstreamResponse> res =
                    rest.exchange(dailyApi, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), UpstreamResponse.class);

            UpstreamResponse body = res.getBody();
            List<ExchangeRate> out = new ArrayList<>();
            if (body == null || body.data == null) return out;

            OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
            for (UpstreamRate r : body.data) {
                String from = safe(r.fromCurrency);
                String to   = safe(r.toCurrency);
                if (from.isEmpty() || to.isEmpty() || r.exchangeRate == null) continue;

                ExchangeRateId id = new ExchangeRateId(targetDate, from, to, SOURCE_DAILY);
                out.add(new ExchangeRate(id, r.exchangeRate, now));
            }
            log.info("Primary daily fetch returned {} rows for {}", out.size(), targetDate);
            return out;
        } catch (Exception e) {
            log.error("Primary daily fetch failed: {}", e.getMessage());
            return List.of();
        }
    }

    public List<ExchangeRate> fetchFallbackFromExchangerateHost(LocalDate targetDate) {
        try {
            String symbols = String.join(",", FALLBACK_SYMBOLS);
            String url = "https://api.exchangerate.host/latest?base=USD&symbols=" + symbols;

            @SuppressWarnings("unchecked")
            Map<String, Object> resp = rest.getForObject(url, Map.class);
            if (resp == null) return List.of();

            @SuppressWarnings("unchecked")
            Map<String, Object> rates = (Map<String, Object>) resp.get("rates");
            if (rates == null || rates.isEmpty()) return List.of();

            OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
            List<ExchangeRate> out = new ArrayList<>();
            for (String to : FALLBACK_SYMBOLS) {
                Object v = rates.get(to);
                if (v == null) continue;
                BigDecimal rate = new BigDecimal(v.toString());
                ExchangeRateId id = new ExchangeRateId(targetDate, "USD", to, SOURCE_DAILY);
                out.add(new ExchangeRate(id, rate, now));
            }
            log.info("Fallback produced {} rows for {}", out.size(), targetDate);
            return out;
        } catch (Exception e) {
            log.error("Fallback fetch failed: {}", e.getMessage());
            return List.of();
        }
    }

    @Transactional
    public void replaceDailyRates(LocalDate date, List<ExchangeRate> fresh) {
        List<ExchangeRate> existing = repo.findAllById_RateDateAndId_Source(date, SOURCE_DAILY);
        if (!existing.isEmpty()) {
            repo.deleteAllInBatch(existing);
            em.flush();
            em.clear();
        }
        if (!fresh.isEmpty()) {
            repo.saveAll(fresh);
        }
    }

    private static String safe(String s) { return s == null ? "" : s.trim(); }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class UpstreamResponse {
        public Integer status;
        public List<UpstreamRate> data;
        public String err;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class UpstreamRate {
        @JsonProperty("from_currency") public String fromCurrency;
        @JsonProperty("to_currency")   public String toCurrency;
        @JsonProperty("exchange_rate") public BigDecimal exchangeRate;
        public String date;
        @JsonProperty("created_at") public String createdAt;
    }
}
