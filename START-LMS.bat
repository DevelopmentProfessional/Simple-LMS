@echo off
cd /d "%~dp0"
REM Kill any previous node server.js process
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4848') do taskkill /F /PID %%a >nul 2>&1
REM Optionally, kill all node processes (uncomment next line if needed)
REM taskkill /F /IM node.exe >nul 2>&1
start http://localhost:4848
node server.js
pause
