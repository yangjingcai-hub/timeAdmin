@echo off
chcp 65001 >nul
setlocal
rem Let Windows PowerShell use its own modules when called from PowerShell 7.
set "PSModulePath="
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-project.ps1"
if errorlevel 1 (
  echo.
  echo Startup failed. See the message above and .run.local\one-click\logs.
  pause
  exit /b 1
)
exit /b 0
