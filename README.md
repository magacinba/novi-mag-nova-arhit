# NOVI MAGACIN - Routing

## Lokalno pokretanje

### Backend (FastAPI)
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

### Frontend (HTML)
```powershell
cd "C:\Users\ThinkCentre Win10\Desktop\CODEX\novi mag nov arh"
python -m http.server 5500
```
Otvori:
- http://127.0.0.1:5500/frontend/index.html

## Online (GitHub Pages)
- Deploy radi iz foldera `frontend` preko GitHub Actions.
- Ako backend nije na istom domenu, prosledi API ovako:

`https://<tvoj-pages-url>/index.html?api=https://<tvoj-backend>`

## Napomena o API bazi
Podrazumevano je `http://127.0.0.1:8000`. Možeš ručno promeniti u:
`frontend/js/config.js`

## Brzi online start (Cloudflare Tunnel)
Pokreni:
`C:\Users\ThinkCentre Win10\Desktop\CODEX\novi mag nov arh\start-backend-tunnel.cmd`

Skripta automatski:
- startuje backend
- startuje tunnel
- otvara online URL
- snimi URL u `online-url.txt`
