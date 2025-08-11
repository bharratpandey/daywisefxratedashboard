package org.example.daywisefxratedashboard.controller;

import org.example.daywisefxratedashboard.service.ExchangeRateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class ExchangeRateController {

    @Autowired
    private ExchangeRateService exchangeRateService;

    @GetMapping("/api/exchange_rates")
    public List<Map<String, Object>> getRates(@RequestParam String date) {
        return exchangeRateService.getExchangeRates(date);
    }
}
