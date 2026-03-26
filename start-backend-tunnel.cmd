@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "TUNNEL_LOG=%TEMP%\cloudflared_tunnel.log"
if exist "%TUNNEL_LOG%" del "%TUNNEL_LOG%"

set "ROOT_DIR=C:\Users\ThinkCentre Win10\Desktop\CODEX\novi mag nov arh"
set "BACKEND_DIR=%ROOT_DIR%\backend"
set "PAGE_BASE=https://magacinba.github.io/novi-mag-nova-arhit/login.html?api="

if not exist "%BACKEND_DIR%\.venv\Scripts\python.exe" (
  echo ERROR: Virtual env not found at %BACKEND_DIR%\.venv
  pause
  exit /b 1
)

for /f "delims=" %%A in ('where cloudflared 2^>nul') do set "CLOUDFLARED=%%A"
if "%CLOUDFLARED%"=="" (
  echo ERROR: cloudflared not found in PATH.
  pause
  exit /b 1
)

echo Starting backend (FastAPI)...
start "Backend" cmd /k "cd /d %BACKEND_DIR% && set AUTH_DISABLED=1 && .\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload"

ping 127.0.0.1 -n 2 > nul

echo Starting Cloudflare Tunnel (logging to %TUNNEL_LOG%)...
start "Tunnel" cmd /k "cloudflared tunnel --url http://127.0.0.1:8000 --logfile %TUNNEL_LOG% --loglevel info"

echo Waiting for tunnel URL...
set "URL="
for /l %%I in (1,1,120) do (
  for /f "usebackq delims=" %%L in (`powershell -NoProfile -Command "if (Test-Path '%TUNNEL_LOG%') { Get-Content '%TUNNEL_LOG%' -Tail 200 | Select-String -Pattern 'https://[^ ]+trycloudflare.com' | Select-Object -Last 1 | ForEach-Object { $_.Matches[0].Value } }"`) do (
    set "URL=%%L"
  )
  if not "!URL!"=="" goto found
  timeout /t 1 > nul
)

echo ERROR: Tunnel URL not found. Check the Tunnel window.
pause
exit /b 1

:found
for /f "delims=" %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMddHHmmss"') do set "TS=%%T"

echo.
echo Tunnel URL: !URL!
set "FULL_URL=%PAGE_BASE%!URL!&nol=1&t=%TS%"
echo Opening: !FULL_URL!

echo !FULL_URL!>"%ROOT_DIR%\online-url.txt"
echo !FULL_URL! | clip

echo.
echo URL saved to: %ROOT_DIR%\online-url.txt
echo URL copied to clipboard.

echo.
start "Browser" "!FULL_URL!"

echo.
pause
endlocal
