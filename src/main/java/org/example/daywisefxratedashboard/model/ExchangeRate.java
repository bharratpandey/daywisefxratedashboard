package org.example.daywisefxratedashboard.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(
        name = "exchange_rate",
        uniqueConstraints = @UniqueConstraint(columnNames = {"rate_date","from_currency","to_currency","source"})
)
public class ExchangeRate {

    @EmbeddedId
    private ExchangeRateId id;

    @Column(name = "rate", nullable = false, precision = 34, scale = 10)
    private BigDecimal rate;

    @Column(name = "fetched_at", nullable = false)
    private OffsetDateTime fetchedAt;

    public ExchangeRate() {}

    public ExchangeRate(ExchangeRateId id, BigDecimal rate, OffsetDateTime fetchedAt) {
        this.id = id;
        this.rate = rate;
        this.fetchedAt = fetchedAt;
    }

    public ExchangeRateId getId() { return id; }
    public void setId(ExchangeRateId id) { this.id = id; }

    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }

    public OffsetDateTime getFetchedAt() { return fetchedAt; }
    public void setFetchedAt(OffsetDateTime fetchedAt) { this.fetchedAt = fetchedAt; }
}
