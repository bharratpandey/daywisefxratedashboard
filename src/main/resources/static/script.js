// ================= CONFIG =================
// Daily (GET via your Spring proxy)
const DAILY_API_URL = "/api/daily_exchange_rates";

// User-defined (GET via your Spring proxy)
const USER_API_URL = "/api/user_exchange_rates";

// Optional (only needed if you decide to call the remote API directly from the browser;
// with the proxy you don't need these here)
const USER_API_TOKEN = ""; // e.g., "eyJhbGciOiJIUzI1NiIs..."
const ORG_ID = "";         // e.g., "447b6b63-be1d-446c-96b3-631361852a22"

const currencies = ["USD", "INR", "EUR", "AED", "SAR"];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.querySelector("#refresh-btn");
  const dateInput = document.querySelector("#date-input");
  const currencySearch = document.querySelector("#currency-search");
  const tbody = document.querySelector("#rates-table tbody");
  const userTbody = document.querySelector("#user-table tbody");

  const today = new Date().toISOString().split("T")[0];
  if (dateInput) {
    dateInput.max = today;
    dateInput.value = today;
  }

  let fetchedRates = [];       // daily list
  let fetchedUserRates = [];   // user-defined list
  let userInputs = {};         // daily inputs
  let userDefinedInputs = {};  // user-defined inputs

  // ================= TAB SWITCH =================
  const dailyTab = document.querySelector("#daily-tab");
  const userTab = document.querySelector("#user-tab");
  const dailySection = document.querySelector("#daily-section");
  const userSection = document.querySelector("#user-section");

  if (dailyTab && userTab && dailySection && userSection) {
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
      fetchUserRates(); // reload when needed
    });
  }

  if (refreshBtn && dateInput) {
    refreshBtn.addEventListener("click", () => loadDailyRates());
  }

  if (currencySearch) {
    currencySearch.addEventListener("input", () => {
      const query = currencySearch.value.trim().toUpperCase();
      filterAndRenderRates(query);
    });
  }

  // ================= HELPERS =================
  function toNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function currencySymbol(code) {
    switch (code) {
      case "SAR": return "﷼";
      case "AED": return "د.إ";
      case "EUR": return "€";
      case "INR": return "₹";
      case "USD": return "$";
      default:    return "";
    }
  }

  // Converted (result) values must show 4 decimals
  // Symbol placement rules:
  // SAR → 100.0000 ﷼ (suffix)
  // AED → د.إ 100.0000 (prefix + space)
  // EUR → €100.0000 (prefix)
  // INR → ₹100.0000 (prefix)
  // USD → $100.0000  (prefix)
  function formatCurrency(amount, code) {
    if (amount === "" || amount === null || amount === undefined) return "";
    const v = toNum(amount);
    if (!Number.isFinite(v)) return "";
    const fixed = v.toFixed(4);
    const sym = currencySymbol(code);
    if (code === "SAR") return `${fixed} ${sym}`;
    if (code === "AED") return `${sym} ${fixed}`;
    return `${sym}${fixed}`;
  }

  // Placeholder when no amount entered — show code + symbol (no number)
  function placeholderToCurrency(code) {
    const sym = currencySymbol(code);
    return `${code} ${sym}`;
  }

  function safeDate(d) {
    if (!d) return "-";
    if (typeof d === "string" && d.includes("T")) return d.split("T")[0];
    return d;
  }

  // ================= DAILY (GET /daily_exchange_rates) =================
  async function loadDailyRates() {
    const selectedDate = document.querySelector("#date-input")?.value;
    const url = selectedDate
      ? `${DAILY_API_URL}?date=${selectedDate}`
      : DAILY_API_URL;

    tbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch daily rates (${res.status})`);
      const data = await res.json();
      fetchedRates = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      renderDailyTable(fetchedRates);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`;
    }
  }


  // ================= USER-DEFINED (GET /user_exchange_rates) =================
  async function fetchUserRates() {
    userTbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;
    try {
      // These headers are only needed if your proxy expects them from the browser.
      // Typically your Spring proxy will add real Authorization/orgid to the upstream call.
      const headers = { "Accept": "application/json" };
      if (USER_API_TOKEN) headers["Authorization"] = `Bearer ${USER_API_TOKEN}`;
      if (ORG_ID) headers["orgid"] = ORG_ID;

      const res = await fetch(USER_API_URL, { method: "GET", headers });
      if (!res.ok) throw new Error(`Failed to fetch user-defined rates (${res.status})`);

      const data = await res.json();
      fetchedUserRates = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      renderUserTable(fetchedUserRates);
    } catch (err) {
      userTbody.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`;
    }
  }

  // ================= RENDER: DAILY =================
  function renderDailyTable(rates) {
    tbody.innerHTML = "";
    if (!rates.length) {
      tbody.innerHTML = `<tr><td colspan="4">No rates available</td></tr>`;
      return;
    }

    rates.forEach((rate, idx) => {
      const amount = userInputs[idx] ?? "";
      const exRate = toNum(rate.exchange_rate);
      const toCur = rate.to_currency;
      const created = safeDate(rate.date || rate.created_at);

      const display = amount !== "" && amount !== null
        ? formatCurrency(toNum(amount) * exRate, toCur)
        : placeholderToCurrency(toCur);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${created}</td>
        <td>
          <input type="number"
                 placeholder="${rate.from_currency}"
                 value="${amount}"
                 style="width:100px; padding:5px;"
                 data-index="${idx}"
                 data-rate="${exRate}"
          /> ${rate.from_currency}
        </td>
        <td id="converted-${idx}">${display}</td>
        <td>${rate.exchange_rate}</td>
      `;
      tbody.appendChild(tr);
    });

    // bind listeners
    tbody.querySelectorAll("input[type='number']").forEach(inp => {
      inp.addEventListener("input", e => {
        const index = Number(e.target.dataset.index);
        const rate  = toNum(e.target.dataset.rate);
        const raw   = e.target.value;
        const val   = raw === "" ? "" : toNum(raw);
        userInputs[index] = raw === "" ? "" : val;

        const toCur = (rates[index] || {}).to_currency;
        const outEl = document.getElementById(`converted-${index}`);
        outEl.textContent =
          raw === "" ? placeholderToCurrency(toCur) : formatCurrency(val * rate, toCur);
      });
    });
  }

  // ================= RENDER: USER-DEFINED =================
  function renderUserTable(rates) {
    userTbody.innerHTML = "";
    if (!rates.length) {
      userTbody.innerHTML = `<tr><td colspan="4">No user-defined rates available</td></tr>`;
      return;
    }

    rates.forEach((rate, idx) => {
      const amount = userDefinedInputs[idx] ?? "";
      const exRate = toNum(rate.exchange_rate);
      const toCur = rate.to_currency;
      const created = safeDate(rate.date || rate.created_at);

      const display = amount !== "" && amount !== null
        ? formatCurrency(toNum(amount) * exRate, toCur)
        : placeholderToCurrency(toCur);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${created}</td>
        <td>
          <input type="number"
                 placeholder="${rate.from_currency}"
                 value="${amount}"
                 style="width:100px; padding:5px;"
                 data-index="${idx}"
                 data-rate="${exRate}"
          /> ${rate.from_currency}
        </td>
        <td id="user-converted-${idx}">${display}</td>
        <td>${rate.exchange_rate}</td>
      `;
      userTbody.appendChild(tr);
    });

    // bind listeners
    userTbody.querySelectorAll("input[type='number']").forEach(inp => {
      inp.addEventListener("input", e => {
        const index = Number(e.target.dataset.index);
        const rate  = toNum(e.target.dataset.rate);
        const raw   = e.target.value;
        const val   = raw === "" ? "" : toNum(raw);
        userDefinedInputs[index] = raw === "" ? "" : val;

        const toCur = (rates[index] || {}).to_currency;
        const outEl = document.getElementById(`user-converted-${index}`);
        outEl.textContent =
          raw === "" ? placeholderToCurrency(toCur) : formatCurrency(val * rate, toCur);
      });
    });
  }

  // ================= SEARCH FILTER (DAILY TABLE ONLY) =================
  function filterAndRenderRates(query) {
    if (!query) return renderDailyTable(fetchedRates);
    const filtered = fetchedRates.filter(r =>
      (r.from_currency || "").toUpperCase().includes(query) ||
      (r.to_currency || "").toUpperCase().includes(query)
    );
    renderDailyTable(filtered);
  }

  // ================= AUTO LOAD =================
  loadDailyRates();
  // fetch user-defined only when the tab is opened; uncomment to auto-load on page open:
  // fetchUserRates();
});
