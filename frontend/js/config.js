// Global config/state
// Set first entry to your backend base URL. Keep "" for same-origin/local testing.
const API_LIST = [
  "",
  "http://127.0.0.1:8000"
];
let API = API_LIST[0];

function setApiBase(url) {
  API = url || "";
}

let SESSION_ID = null;
let LOADING = false;
let scannedInvoices = [];
let uploadedItems = [];
let waveData = null;
let waveStartTime = null;
let timerInterval = null;
