@echo off
echo Starting Job Smartr Backend on http://127.0.0.1:8000 ...
cd /d "%~dp0backend"
.\venv\Scripts\uvicorn.exe server:app --host 127.0.0.1 --port 8000 --reload
pause
