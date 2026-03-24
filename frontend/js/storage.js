// Session storage helpers
function saveSession() {
  try {
    localStorage.setItem("session_id", SESSION_ID || "");
    localStorage.setItem("wave_data", JSON.stringify(waveData || null));
  } catch (err) {
    console.warn("Save session failed", err);
  }
}

function loadSession() {
  try {
    const storedId = localStorage.getItem("session_id");
    SESSION_ID = storedId || null;

    const storedWave = localStorage.getItem("wave_data");
    waveData = storedWave ? JSON.parse(storedWave) : null;
  } catch (err) {
    console.warn("Load session failed", err);
  }
}

function clearSession() {
  try {
    localStorage.removeItem("session_id");
    localStorage.removeItem("wave_data");
  } catch (err) {
    console.warn("Clear session failed", err);
  }
}
