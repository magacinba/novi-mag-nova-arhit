// API helpers
function apiUrl(path) {
  return `${API}${path}`;
}

async function apiGetJson(path) {
  const data = await safeFetch(apiUrl(path), { method: "GET" });
  return { res: { ok: data !== null }, data };
}

async function apiPostJson(path, body) {
  const data = await safeFetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return { res: { ok: data !== null }, data };
}
