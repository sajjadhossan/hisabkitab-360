@echo off
setlocal
cd /d "%~dp0"
title HisabKitab 360 - Host Preview Server
cls
echo ===================================================================
echo       HISABKITAB 360 - MOBILE & LOCAL HOST PREVIEW
echo ===================================================================
echo.
echo [1] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js পাওয়া যায়নি! দয়া করে https://nodejs.org থেকে Node.js ইনস্টল করুন।
    pause
    exit /b 1
)

echo [2] Starting Vite Preview Server...
echo.
node preview_server.cjs
pause
