@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo   Nokta - E-Commerce Management Frontend
echo ==============================================
if not exist node_modules (
  echo Installing packages for the first run...
  call npm install
  if errorlevel 1 (
    echo.
    echo Package installation failed. Check your internet connection and Node.js/npm installation.
    pause
    exit /b 1
  )
)
if not exist .env (
  copy .env.example .env >nul
  echo Created .env from .env.example. Please check the API port in .env.
)
call npm run dev
pause
