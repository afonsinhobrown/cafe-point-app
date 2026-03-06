@echo off
title LIMPEZA TOTAL CAFEPOINT
color 0c
cd /d "%~dp0"

echo ===================================================
echo      LIMPEZA DE FABRICA (RESET TOTAL)
echo ===================================================
echo.
echo A apagar vestigios antigos o sistema...

:: 1. Apagar Pasta de Instalacao
if exist "C:\CafePoint" (
    echo [1/3] Removendo C:\CafePoint...
    rmdir /s /q "C:\CafePoint"
)

:: 2. Apagar Dados de Aplicacao (AppData)
if exist "%APPDATA%\CafePoint" (
    echo [2/3] Removendo AppData...
    rmdir /s /q "%APPDATA%\CafePoint"
)

:: 3. Apagar Dados de Programa (ProgramData - Onde ficam logs de sistema)
if exist "%PROGRAMDATA%\CafePoint" (
    echo [3/3] Removendo ProgramData...
    rmdir /s /q "%PROGRAMDATA%\CafePoint"
)

:: 4. Apagar licenca local se existir
if exist ".license.key" del /f /q ".license.key"

echo.
echo ===================================================
echo    COMPUTADOR LIMPO COM SUCESSO!
echo ===================================================
echo Agora pode instalar o sistema do zero sem conflitos.
pause
