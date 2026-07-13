@echo off
title Beloved Gifting App Launcher
cd /d "%~dp0"

echo =========================================
echo       Beloved App Launcher 💝             
echo =========================================
echo.

echo [1/3] Syncing and indexing flower assets...
call node scripts/generate-flower-list.js

echo.
echo [2/3] Launching development server...
:: Starts the dev server in a separate CMD window to keep this one clean
start "Beloved Dev Server" cmd /c "npm run dev"

echo.
echo [3/3] Waiting for server to initialize...
:: Wait 3 seconds for Vite to spin up
timeout /t 3 /nobreak >nul

echo.
echo Opening browser to http://localhost:5173...
start http://localhost:5173

echo.
echo =========================================
echo Beloved is running successfully! 🌸
echo Keep this window open. Press any key to exit launcher.
echo =========================================
pause >nul
