@echo off
:: SAFE dev server restart — only kills port 3000, never touches other node processes
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
  echo Killing PID %%a on port 3000
  taskkill /F /PID %%a 2>nul
)
echo Port 3000 freed
