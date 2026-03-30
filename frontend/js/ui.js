// UI helpers (moved from index.html)
function getBoxColor(box) {
    const colors = {
        1: '#3b82f6',
        2: '#22c55e',
        3: '#eab308',
        4: '#f97316',
        5: '#ef4444',
        6: '#a855f7'
    };
    return colors[box] || '#64748b';
}

function setLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    isOnline = navigator.onLine;
    statusEl.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
}
