// Global config/state
// First entry is the default API base for local dev.
const API_LIST = [
  "http://127.0.0.1:8000",
  ""
];
let API = API_LIST[0];

function setApiBase(url, persist = true) {
  API = url || "";
  if (persist) {
    try {
      localStorage.setItem("api", API);
      localStorage.setItem("api_base", API);
    } catch {}
  }
}

function initApiBase() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("api");
    if (fromQuery) {
      setApiBase(fromQuery, true);
      return;
    }
  } catch {}

  try {
    const fromStorage = localStorage.getItem("api") || localStorage.getItem("api_base");
    if (fromStorage) {
      API = fromStorage;
      return;
    }
  } catch {}

  API = API_LIST[0] || "";
}

let SESSION_ID = null;
let LOADING = false;
let scannedInvoices = [];
let uploadedItems = [];
let waveData = null;
let waveStartTime = null;
let timerInterval = null;
