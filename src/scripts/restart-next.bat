@echo off
echo ===== Restarting Next.js Server =====
echo.
echo This will stop any running Next.js server and restart it with updated environment variables.
echo.
echo Press Ctrl+C at any time to stop the server.
echo.

echo 1. Finding and stopping any running Next.js servers...
taskkill /f /im node.exe >nul 2>&1

echo 2. Starting Next.js development server...
echo.
echo Server output will appear below. Your application will be available at:
echo http://localhost:3000/upload
echo.

cd /d %~dp0\..\..
npm run dev 