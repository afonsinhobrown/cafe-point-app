@echo off
title CONSTRUTOR CAFEPOINT
color 0f
cd /d "%~dp0"

echo ===================================================
echo      GERADOR DE PACOTES DE INSTALACAO
echo ===================================================
echo.
echo A compilar e empacotar o software...
echo (Isto pode demorar 1 ou 2 minutos)
echo.

call npx ts-node backend/scripts/build_usb_installer.ts

if %errorlevel% neq 0 (
    color 0c
    echo [ERRO] Ocorreu um erro na construcao.
    pause
    exit
)

echo.
echo [SUCESSO] Pastas criadas em: ..\cafepoint-installer
echo.
pause
