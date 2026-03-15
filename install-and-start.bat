@echo off
chcp 65001 >nul
echo.
echo === Pyth terminal: install and start ===
echo Press any key to START...
pause >nul
echo.
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm not found. Install Node.js and add it to PATH.
  goto done
)
echo Folder: %cd%
echo.
echo Installing dependencies...
call npm install
if errorlevel 1 (
  echo.
  echo ERROR: npm install failed. Check the message above.
  goto done
)
echo.
echo Starting Pyth terminal - http://localhost:5000
echo (Close the server with Ctrl+C, then press any key to close window)
echo.
npm run server
:done
echo.
echo ========================================
echo Done. Press any key to CLOSE this window.
echo ========================================
pause >nul
