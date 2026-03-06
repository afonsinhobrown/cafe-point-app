@echo off
title CAFE POINT SYSTEM
color 0f

:: 1. Ir para a pasta do sistema
cd /d C:\CafePoint\backend

echo ==============================================
echo      A INICIAR CAFE POINT...
echo ==============================================

:: 2. Garantir que a Base de Dados está atualizada
echo [1/2] Verificando Base de Dados...
if exist "node_modules\.bin\prisma.cmd" (
    call node_modules\.bin\prisma.cmd db push --accept-data-loss >nul 2>&1
)

:: 3. Abrir o Navegador
echo [2/2] Abrindo Interface...
timeout /t 3 >nul
start "" "http://localhost:5000"

:: 4. Ligar o Motor (Servidor)
echo.
echo SISTEMA PRONTO! 
echo Nao feche esta janela enquanto usar o Cafe Point.
echo.
node dist/src/index.js
pause
