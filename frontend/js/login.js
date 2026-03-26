function showError(msg) {
    const el = document.getElementById("error");
    if (!msg) {
        el.style.display = "none";
        el.textContent = "";
        return;
    }
    el.textContent = msg;
    el.style.display = "block";
}

function buildRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    const api = params.get("api");
    if (api) {
        return `index.html?api=${encodeURIComponent(api)}`;
    }
    return "index.html";
}

async function login() {
    showError("");
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const apiUrl = document.getElementById("apiUrl").value.trim();
    if (apiUrl) setApiBase(apiUrl, true);
    if (!username || !password) {
        showError("Unesi korisničko ime i lozinku.");
        return;
    }
    try {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Greška prijave");
        window.location.href = buildRedirectUrl();
    } catch (err) {
        showError(err.message);
    }
}

window.addEventListener("load", () => {
    initApiBase();
    const apiInput = document.getElementById("apiUrl");
    apiInput.value = API || "";
    document.getElementById("loginBtn").addEventListener("click", login);
});
