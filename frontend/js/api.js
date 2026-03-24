// API helpers
function apiUrl(path) {
  return `${API}${path}`;
}

async function apiGet(path) {
  return fetch(apiUrl(path));
}

async function apiGetJson(path) {
  const res = await apiGet(path);
  const data = await res.json();
  return { res, data };
}

async function apiPostJson(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { res, data };
}
