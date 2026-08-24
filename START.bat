@echo off
echo ============================================================
echo   AI Letter Pad Platform - Tamil Nadu
echo   Starting Backend + Frontend
echo ============================================================
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "Letter Pad Backend" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Port 3000)...
start "Letter Pad Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ============================================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:3000
