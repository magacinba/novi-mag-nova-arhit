// Central error handling
function safeFetch(url, options = {}) {
  return fetch(url, options)
    .then(async (res) => {
      let data = null;
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error((data && data.detail) || `HTTP ${res.status}`);
      return data;
    })
    .catch((err) => {
      console.error(err);
      alert("Greška server konekcije");
      return null;
    });
}
