// API helpers
function apiUrl(path) {
  return `${API}${path}`;
}

function showApiError(message) {
  console.error(message);
  alert("Greška konekcije sa serverom");
}

async function safeFetchJson(path, options = {}) {
  try {
    const res = await fetch(apiUrl(path), options);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { res, data, error: null };
  } catch (err) {
    showApiError(err);
    return { res: null, data: null, error: err };
  }
}

async function apiGetJson(path) {
  return safeFetchJson(path, { method: "GET" });
}

async function apiPostJson(path, body) {
  return safeFetchJson(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
