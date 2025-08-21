// ================= CONFIG =================
const API_URL = "/api/exchange_rates";  // Spring backend endpoint
const USER_API_URL = "https://devapi-embcrm.exmyb.com/api/v1/exchange-rate"; // user defined API
const currencies = ["USD", "INR", "EUR", "AED", "SAR"];

const currencySymbols = {
  INR: "₹",
  AED: "د.إ",
  SAR: "﷼",
  EUR: "€",
  USD: "$",
};

// ================= EXTERNAL API HELPERS =================
const API_BASE = "https://api.exchangerate.host";

/**
 * Fetches latest exchange rates for a given base currency.
 */
async function getLatestRates(baseCurrency = "USD") {
  const url = `${API_BASE}/latest?base=${baseCurrency}`;
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
  const url = `${API_BASE}/${date}?base=${baseCurrency}`;
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

// ================= MAIN APP =================
document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.querySelector("#refresh-btn");
  const dateInput = document.querySelector("#date-input");
  const currencySearch = document.querySelector("#currency-search");
  const tbody = document.querySelector("#rates-table tbody");
  const userTbody = document.querySelector("#user-table tbody");

  const today = new Date().toISOString().split("T")[0];
  dateInput.max = today;
  dateInput.value = today;

  let fetchedRates = [];

  // Tab switch
  const dailyTab = document.querySelector("#daily-tab");
  const userTab = document.querySelector("#user-tab");
  const dailySection = document.querySelector("#daily-section");
  const userSection = document.querySelector("#user-section");

  dailyTab.addEventListener("click", () => {
    dailyTab.classList.add("active");
    userTab.classList.remove("active");
    dailySection.style.display = "block";
    userSection.style.display = "none";
  });

  userTab.addEventListener("click", () => {
    userTab.classList.add("active");
    dailyTab.classList.remove("active");
    dailySection.style.display = "none";
    userSection.style.display = "block";
    loadUserRates();
  });

  refreshBtn.addEventListener("click", () => {
    const selectedDate = dateInput.value;
    loadRates(selectedDate);
  });

  currencySearch.addEventListener("input", () => {
    const query = currencySearch.value.trim().toUpperCase();
    filterAndRenderRates(query);
  });

  loadRates(today);



  // DAILY FX LOAD
  async function loadRates(date) {
    tbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
    try {
      const url = `${API_URL}?date=${date}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch rates");

      const data = await response.json();

      fetchedRates = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      if (fetchedRates.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No rates available</td></tr>`;
        return;
      }

      currencySearch.value = "";
      renderRates(fetchedRates);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`;
    }
  }

  // USER DEFINED LOAD
  async function loadUserRates() {
    userTbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
    try {
      const response = await fetch(USER_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc0NjEwMjM4NywianRpIjoiOGM3M2JhNGYtZmE3Mi00ZjkyLWI5ZTktNTM5ODM5MDcxOWYxIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6ImJhZTg1NjdiLTM2ZDktNDg1ZS04MWMzLWNhMmQzZDE1NDM2YSIsIm5iZiI6MTc0NjEwMjM4NywiY3NyZiI6ImNlOGRkZmJjLWIzMzEtNDdmZS05NWZhLTJmMGM1ZjE4OWUyZCJ9.uEmC2-lVxoiDl6QwShLRrEB3XZ__28A7gAzRAjcgjy4",
          "orgid": "447b6b63-be1d-446c-96b3-631361852a22",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch user defined rates");

      const data = await response.json();

      const rates = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      if (rates.length === 0) {
        userTbody.innerHTML = `<tr><td colspan="4">No rates available</td></tr>`;
        return;
      }

      userTbody.innerHTML = "";
      for (const rate of rates) {
        const row = `
          <tr>
            <td>${rate.date || rate.created_at?.split("T")[0] || "-"}</td>
            <td>${currencySymbols[rate.from_currency] || ""} ${rate.from_currency}</td>
            <td>${currencySymbols[rate.to_currency] || ""} ${rate.to_currency}</td>
            <td>${rate.exchange_rate}</td>
          </tr>
        `;
        userTbody.insertAdjacentHTML("beforeend", row);
      }
    } catch (err) {
      userTbody.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`;
    }
  }

  // ✅ User Defined FX Search
  document.getElementById("user-currency-search").addEventListener("keyup", function () {
      let filter = this.value.toUpperCase();
      let rows = document.querySelectorAll("#user-table tbody tr");

      rows.forEach(row => {
          let fromCurrency = row.cells[1]?.textContent.toUpperCase() || "";
          let toCurrency = row.cells[2]?.textContent.toUpperCase() || "";

          if (fromCurrency.includes(filter) || toCurrency.includes(filter)) {
              row.style.display = "";
          } else {
              row.style.display = "none";
          }
      });
  });


  // Filter + Render
  function filterAndRenderRates(query) {
    if (!query) {
      renderRates(fetchedRates);
      return;
    }
    const filtered = fetchedRates.filter(
      (rate) =>
        rate.from_currency?.toUpperCase().includes(query) ||
        rate.to_currency?.toUpperCase().includes(query)
    );
    renderRates(filtered);
  }

  function renderRates(rates) {
    tbody.innerHTML = "";
    if (rates.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No rates available</td></tr>`;
      return;
    }
    for (const rate of rates) {
      const row = `
        <tr>
          <td>${rate.date || rate.created_at?.split("T")[0] || "-"}</td>
          <td>${currencySymbols[rate.from_currency] || ""} ${rate.from_currency}</td>
          <td>${currencySymbols[rate.to_currency] || ""} ${rate.to_currency}</td>
          <td>${rate.exchange_rate}</td>
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", row);
    }
  }
});
