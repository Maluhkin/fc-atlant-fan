@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Запускаю приложение ФК «Атлант»...
echo.
node server.js
echo.
echo Сервер остановлен. Нажмите любую клавишу, чтобы закрыть окно.
pause >nul
