# NOVI MAGACIN - Routing

## Lokalno pokretanje

### Backend
```powershell
cd "C:\Users\ThinkCentre Win10\Desktop\CODEX\novi mag nov arh\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Provera:
- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/wave/__debug

### Frontend
```powershell
cd "C:\Users\ThinkCentre Win10\Desktop\CODEX\novi mag nov arh"
python -m http.server 5500
```
Otvori:
- http://127.0.0.1:5500/frontend/index.html

## Produkcija

### GitHub Pages (frontend)
Deploy radi iz foldera `frontend` preko GitHub Actions.

### Backend (Render ili lokalni tunel)
Ako backend nije na istom domenu, prosledi API parametar:

`index.html?api=https://backend-url`

## Brzi online start (Cloudflare Tunnel)
Pokreni:
`C:\Users\ThinkCentre Win10\Desktop\CODEX\novi mag nov arh\start-backend-tunnel.cmd`

Skripta automatski:
- startuje backend
- startuje tunnel
- otvara online URL
- snimi URL u `online-url.txt`
