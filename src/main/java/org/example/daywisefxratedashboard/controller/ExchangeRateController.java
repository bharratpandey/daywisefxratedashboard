package org.example.daywisefxratedashboard.controller;

import org.example.daywisefxratedashboard.model.ExchangeRate;
import org.example.daywisefxratedashboard.service.ExchangeRateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:3000", "http://127.0.0.1:8080"}, allowCredentials = "true")
public class ExchangeRateController {

    private static final Logger log = LoggerFactory.getLogger(ExchangeRateController.class);
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final ExchangeRateService exchangeRateService;
    private final RestTemplate restTemplate = new RestTemplate();

    // user-defined upstream (optional auth)
    @Value("${fx.user.api}")    private String userApi;
    @Value("${fx.user.token:}") private String userToken;
    @Value("${fx.user.org-id:}") private String orgId;

    // cron protection
    @Value("${cron.key:}") private String cronKey;

    public ExchangeRateController(ExchangeRateService exchangeRateService) {
        this.exchangeRateService = exchangeRateService;
    }

    // -------- Health --------
    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "time", java.time.ZonedDateTime.now(IST).toString()
        );
    }

    // -------- Read daily rates (from DB) --------
    @GetMapping("/daily_exchange_rates")
    public ResponseEntity<?> getDailyRates(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate d = (date != null) ? date : LocalDate.now(IST);
        List<ExchangeRate> list = exchangeRateService.getRatesForDate(d);
        Map<String, Object> resp = new HashMap<>();
        resp.put("status", 1);
        resp.put("data", toClientPayload(list, d));
        return ResponseEntity.ok(resp);
    }

    // -------- Manual ingest/backfill (admin) --------
    @PostMapping("/admin/refresh_daily")
    public ResponseEntity<?> refreshDaily(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate d = (date != null) ? date : LocalDate.now(IST);
        int count = exchangeRateService.ingestForDate(d);
        return ResponseEntity.ok(Map.of(
                "status", 1,
                "date", d.toString(),
                "count", count
        ));
    }

    // -------- Cron-protected daily ingest (used by Render Cron Job) --------
    @PostMapping("/internal/cron/fetch-daily")
    public ResponseEntity<?> cronFetchDaily(@RequestHeader(value = "X-CRON-KEY", required = false) String headerKey) {
        if (!isCronAllowed(headerKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "status", 0,
                    "err", "Forbidden: bad or missing X-CRON-KEY"
            ));
        }
        LocalDate d = LocalDate.now(IST);
        int count = exchangeRateService.ingestForDate(d);
        return ResponseEntity.ok(Map.of(
                "status", 1,
                "date", d.toString(),
                "count", count
        ));
    }

    // -------- Proxy: user-defined exchange rates (upstream) --------
    @GetMapping("/user_exchange_rates")
    public ResponseEntity<?> proxyUserRates() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            if (userToken != null && !userToken.isBlank()) headers.setBearerAuth(userToken);
            if (orgId != null && !orgId.isBlank()) headers.add("orgid", orgId);

            HttpEntity<Void> req = new HttpEntity<>(headers);
            ResponseEntity<String> upstream = restTemplate.exchange(
                    userApi, HttpMethod.GET, req, String.class);

            return ResponseEntity.status(upstream.getStatusCode()).body(upstream.getBody());
        } catch (HttpClientErrorException e) {
            return upstreamError(e);
        } catch (Exception e) {
            return internalError(e);
        }
    }

    // -------- Helpers --------
    private boolean isCronAllowed(String headerKey) {
        if (cronKey == null || cronKey.isBlank()) {
            // if you didn’t configure a cron key, reject by default in prod, but allow locally if you want
            log.warn("cron.key is empty; rejecting cron call");
            return false;
        }
        boolean ok = cronKey.equals(headerKey);
        if (!ok) log.warn("Bad X-CRON-KEY received");
        return ok;
    }

    private List<Map<String, Object>> toClientPayload(List<ExchangeRate> list, LocalDate date) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (ExchangeRate e : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("date", date.toString());
            m.put("from_currency", e.getId().getFromCurrency());
            m.put("to_currency", e.getId().getToCurrency());
            m.put("exchange_rate", e.getRate());
            out.add(m);
        }
        return out;
    }

    private ResponseEntity<Map<String, Object>> upstreamError(HttpClientErrorException e) {
        Map<String, Object> err = new HashMap<>();
        err.put("status", 0);
        err.put("data", null);
        err.put("err", e.getResponseBodyAsString());
        return ResponseEntity.status(e.getStatusCode()).body(err);
    }

    private ResponseEntity<Map<String, Object>> internalError(Exception e) {
        Map<String, Object> err = new HashMap<>();
        err.put("status", 0);
        err.put("data", null);
        err.put("err", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
    }
}
