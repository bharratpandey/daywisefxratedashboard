package org.example.daywisefxratedashboard.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class ExchangeRateService {

    private static final String API_URL = "https://devapi-embcrm.exmyb.com/api/v1/daily_exchange_rates";

    private static final Map<String, String> currencySymbols = Map.of(
            "INR", "₹",
            "AED", "د.إ",
            "SAR", "﷼",
            "EUR", "€",
            "USD", "$"
    );

    public List<Map<String, Object>> getExchangeRates(String date) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = API_URL + "?date=" + date;

            HttpHeaders headers = new HttpHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode() != HttpStatus.OK) {
                throw new RuntimeException("API call failed with status: " + response.getStatusCodeValue());
            }

            String jsonResponse = response.getBody();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);

            if (root.has("status") && root.get("status").asInt() != 1) {
                throw new RuntimeException("API returned error: " + root.path("message").asText());
            }

            JsonNode dataNode = root.get("data");
            if (dataNode == null || !dataNode.isArray()) {
                throw new RuntimeException("Invalid API response: 'data' field missing or not array");
            }

            List<Map<String, Object>> resultList = new ArrayList<>();

            for (JsonNode item : dataNode) {
                Map<String, Object> map = new HashMap<>();
                map.put("date", item.path("created_at").asText().substring(0, 10));
                map.put("from_currency", item.path("from_currency").asText());
                map.put("to_currency", item.path("to_currency").asText());
                map.put("exchange_rate", item.path("exchange_rate").asText());

                String fromCurr = item.path("from_currency").asText();
                String toCurr = item.path("to_currency").asText();
                map.put("from_symbol", currencySymbols.getOrDefault(fromCurr, ""));
                map.put("to_symbol", currencySymbols.getOrDefault(toCurr, ""));

                resultList.add(map);
            }

            return resultList;

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch or parse exchange rates", e);
        }
    }
}
