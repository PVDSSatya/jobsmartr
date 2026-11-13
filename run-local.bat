@echo off
echo ============================================================
echo Starting Job Smartr (Local Environment)
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:3000
echo ============================================================

start "Job Smartr - Backend" cmd /k "%~dp0start-backend.bat"
start "Job Smartr - Frontend" cmd /k "%~dp0start-frontend.bat"

echo Both services launched in separate windows!
