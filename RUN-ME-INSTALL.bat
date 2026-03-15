@echo off
:: Opens a window that STAYS OPEN so you can read any error
start "Pyth terminal" cmd /k "cd /d "%~dp0" && install-and-start.bat"
