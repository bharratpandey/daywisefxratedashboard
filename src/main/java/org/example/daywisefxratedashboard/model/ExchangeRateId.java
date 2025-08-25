package org.example.daywisefxratedashboard.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

@Embeddable
public class ExchangeRateId implements Serializable {

    @Column(name = "rate_date", nullable = false)
    private LocalDate rateDate;

    @Column(name = "from_currency", nullable = false, length = 64)
    private String fromCurrency;

    @Column(name = "to_currency", nullable = false, length = 64)
    private String toCurrency;

    @Column(name = "source", nullable = false, length = 64)
    private String source;

    public ExchangeRateId() {}

    public ExchangeRateId(LocalDate rateDate, String fromCurrency, String toCurrency, String source) {
        this.rateDate = rateDate;
        this.fromCurrency = fromCurrency;
        this.toCurrency = toCurrency;
        this.source = source;
    }

    public LocalDate getRateDate() { return rateDate; }
    public String getFromCurrency() { return fromCurrency; }
    public String getToCurrency() { return toCurrency; }
    public String getSource() { return source; }

    public void setRateDate(LocalDate rateDate) { this.rateDate = rateDate; }
    public void setFromCurrency(String fromCurrency) { this.fromCurrency = fromCurrency; }
    public void setToCurrency(String toCurrency) { this.toCurrency = toCurrency; }
    public void setSource(String source) { this.source = source; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ExchangeRateId that)) return false;
        return Objects.equals(rateDate, that.rateDate) &&
                Objects.equals(fromCurrency, that.fromCurrency) &&
                Objects.equals(toCurrency, that.toCurrency) &&
                Objects.equals(source, that.source);
    }

    @Override
    public int hashCode() {
        return Objects.hash(rateDate, fromCurrency, toCurrency, source);
    }
}
