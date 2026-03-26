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

function applyApiFromQuery() {
    try {
        if (typeof API === "undefined") {
            window.API = "";
        }
        const api = new URLSearchParams(window.location.search).get("api");
        const stored = localStorage.getItem("api") || localStorage.getItem("api_base");
        if (api) API = api;
        else if (API) API = API;
        else if (stored) API = stored;
    } catch {}
}

async function apiFetch(path, options = {}) {
    const base = (typeof API !== "undefined" && API) ? API : "";
    if (!base) throw new Error("API nije podeĹˇen");
    const res = await fetch(`${base}${path}`, {
        credentials: "include",
        cache: "no-store",
        ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Greška");
    return data;
}

async function requireAdmin() {
    try {
        const data = await apiFetch("/auth/me");
        if (data.user.role !== "admin") {
            window.location.href = "login.html";
        }
    } catch {
        window.location.href = "login.html";
    }
}

async function loadUsers() {
    const data = await apiFetch("/users");
    const tbody = document.getElementById("usersTable");
    tbody.innerHTML = "";
    data.users.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.id}</td>
            <td>${u.username}</td>
            <td>
                <select data-id="${u.id}" class="roleSelect">
                    <option value="worker" ${u.role === "worker" ? "selected" : ""}>worker</option>
                    <option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option>
                </select>
            </td>
            <td>${u.created_at}</td>
            <td>
                <button class="btn btn-primary saveBtn" data-id="${u.id}">Sačuvaj</button>
                <button class="btn btn-danger deleteBtn" data-id="${u.id}">Obriši</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function createUser() {
    showError("");
    const username = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    const role = document.getElementById("newRole").value;
    if (!username || !password) {
        showError("Unesi korisničko ime i lozinku.");
        return;
    }
    await apiFetch("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
    });
    document.getElementById("newUsername").value = "";
    document.getElementById("newPassword").value = "";
    await loadUsers();
}

async function saveUser(userId, role) {
    await apiFetch(`/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
    });
    await loadUsers();
}

async function deleteUser(userId) {
    await apiFetch(`/users/${userId}`, { method: "DELETE" });
    await loadUsers();
}

async function logout() {
    try {
        await apiFetch("/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "login.html";
}

window.addEventListener("load", async () => {
    initApiBase();
    applyApiFromQuery();
    await requireAdmin();
    try {
        await loadUsers();
    } catch (err) {
        showError(err.message);
    }

    document.getElementById("createBtn").addEventListener("click", () => {
        createUser().catch(err => showError(err.message));
    });
    document.getElementById("logoutBtn").addEventListener("click", logout);

    document.getElementById("usersTable").addEventListener("click", (e) => {
        const btn = e.target;
        if (btn.classList.contains("saveBtn")) {
            const id = btn.getAttribute("data-id");
            const select = document.querySelector(`select.roleSelect[data-id="${id}"]`);
            saveUser(id, select.value).catch(err => showError(err.message));
        }
        if (btn.classList.contains("deleteBtn")) {
            const id = btn.getAttribute("data-id");
            if (confirm("Obrisati korisnika?")) {
                deleteUser(id).catch(err => showError(err.message));
            }
        }
    });
});
