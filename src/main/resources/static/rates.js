const API_BASE = "https://api.exchangerate.host";

/**
 * Fetches latest exchange rates for a given base currency.
 */
async function getLatestRates(baseCurrency = "USD") {
    const url = `${API_BASE}/latest?base=${baseCurrency}`;  // NO apikey param
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (err) {
        console.error("Error fetching latest rates:", err);
        return null;
    }
}

/**
 * Fetches historical exchange rates for a specific date.
 */
async function getHistoricalRates(date, baseCurrency = "USD") {
    const url = `${API_BASE}/${date}?base=${baseCurrency}`;  // NO apikey param
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (err) {
        console.error("Error fetching historical rates:", err);
        return null;
    }
}

/**
 * Fetches time-series data between two dates.
 */
async function getTimeSeriesRates(startDate, endDate, baseCurrency = "USD", symbols = "EUR,INR,GBP") {
    const url = `${API_BASE}/timeseries?start_date=${startDate}&end_date=${endDate}&base=${baseCurrency}&symbols=${symbols}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (err) {
        console.error("Error fetching time series rates:", err);
        return null;
    }
}
