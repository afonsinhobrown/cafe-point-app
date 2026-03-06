@echo off
title CORRECAO RAPIDA DE LICENCA
color 0e
cd /d "%~dp0"

echo ===========================================
echo   CORRECAO DE LICENCA CAFEPOINT
echo ===========================================
echo.

:: 1. Corrigir posicao da Licenca
if exist "C:\CafePoint\.license.key" (
    echo [1/2] Copiando licenca para a pasta do servidor...
    copy /Y "C:\CafePoint\.license.key" "C:\CafePoint\backend\.license.key" >nul
    echo       Feito.
) else (
    echo [ERRO] Licenca base nao encontrada em C:\CafePoint.
    echo        Execute o INSTALAR_SISTEMA.bat primeiro.
)

:: 2. Limpar erro de "Relogio Atrasado" (Resetar Time Trace)
if exist "%PROGRAMDATA%\CafePoint\.system_trace" (
    echo [2/2] Resetando verificacao de relogio...
    del /f /q "%PROGRAMDATA%\CafePoint\.system_trace"
    echo       Feito.
)

echo.
echo ===========================================
echo   CORRECAO APLICADA!
echo ===========================================
echo Tente abrir o CafePoint novamente.
pause
