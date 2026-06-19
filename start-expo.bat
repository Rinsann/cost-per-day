@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo  Cost Per Day - Expo Dev Server
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js first.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please install npm first.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo node_modules was not found.
  echo Installing dependencies with npm install...
  echo.
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
  )
)

echo Starting Expo in LAN mode...
echo.
echo Make sure your phone and PC are on the same Wi-Fi.
echo Scan the QR code with Expo Go after Metro starts.
echo.

call npx.cmd expo start --lan --clear

echo.
echo Expo server stopped.
pause
