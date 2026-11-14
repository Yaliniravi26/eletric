@echo off
title Start FenceWatch System
echo ========================================================
echo       Starting FenceWatch Monitoring System
echo ========================================================
echo.

echo 1. Starting FastAPI Backend on http://localhost:8000 ...
start "FenceWatch Backend" cmd /k "cd /d %~dp0backend && set PYTHONPATH=%~dp0backend && \"C:\Users\YALINI R\AppData\Local\Programs\Python\Python312\python.exe\" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo 2. Starting Vite Frontend on http://localhost:5173 ...
start "FenceWatch Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both services are now running!
echo Open your browser at: http://localhost:5173
echo.
pause

