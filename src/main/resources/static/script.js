const API_URL = "/api/exchange_rates";  // your Spring backend endpoint
const currencies = ["USD", "INR", "EUR", "AED", "SAR"];

const currencySymbols = {
  INR: "₹",
  AED: "د.إ",
  SAR: "﷼",
  EUR: "€",
  USD: "$",
};

document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.querySelector("#refresh-btn");
  const dateInput = document.querySelector("#date-input");
  const currencySearch = document.querySelector("#currency-search");
  const tbody = document.querySelector("#rates-table tbody");

  const today = new Date().toISOString().split("T")[0];
  dateInput.max = today;
  dateInput.value = today;

  // Store fetched data globally for filtering
  let fetchedRates = [];

  refreshBtn.addEventListener("click", () => {
    const selectedDate = dateInput.value;
    loadRates(selectedDate);
  });

  currencySearch.addEventListener("input", () => {
    const query = currencySearch.value.trim().toUpperCase();
    filterAndRenderRates(query);
  });

  loadRates(today);

  async function loadRates(date) {
    tbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
    try {
      const url = `${API_URL}?date=${date}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch rates");

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        fetchedRates = [];
        tbody.innerHTML = `<tr><td colspan="4">No rates available</td></tr>`;
        return;
      }

      // Save fetched data globally for filtering
      fetchedRates = data;

      // Clear any previous search input
      currencySearch.value = "";

      renderRates(fetchedRates);
    } catch (err) {
      fetchedRates = [];
      tbody.innerHTML = `<tr><td colspan="4">Error loading rates: ${err.message}</td></tr>`;
      console.error(err);
    }
  }

  function filterAndRenderRates(query) {
    if (!query) {
      // No filter, show all
      renderRates(fetchedRates);
      return;
    }

    // Filter rates where from_currency or to_currency matches the query (partial or full match)
    const filtered = fetchedRates.filter(rate =>
      rate.from_currency.toUpperCase().includes(query) ||
      rate.to_currency.toUpperCase().includes(query)
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
          <td>${rate.date}</td>
          <td>${rate.from_symbol} ${rate.from_currency}</td>
          <td>${rate.to_symbol} ${rate.to_currency}</td>
          <td>${rate.exchange_rate}</td>
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", row);
    }
  }
});
