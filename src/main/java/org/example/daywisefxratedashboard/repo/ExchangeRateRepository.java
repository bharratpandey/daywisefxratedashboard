package org.example.daywisefxratedashboard.repo;

import org.example.daywisefxratedashboard.model.ExchangeRate;
import org.example.daywisefxratedashboard.model.ExchangeRateId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, ExchangeRateId> {
    List<ExchangeRate> findAllById_RateDateAndId_Source(LocalDate rateDate, String source);
}
