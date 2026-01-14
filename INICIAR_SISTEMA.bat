@echo off
TITLE CafePoint - Inicializacao do Sistema
echo ===================================================
echo    INICIANDO CAFEPOINT (MODO MONOLITO)
echo ===================================================

echo [1/3] Verificando Build do Frontend...
if not exist "backend\public\index.html" (
    echo Build nao encontrado! Executando script de deploy...
    powershell -ExecutionPolicy Bypass -File deploy_monolith.ps1
)

echo.
echo [2/3] Iniciando Servidor Backend...
cd backend
start "CafePoint Backend" cmd /k "npm run dev"
cd ..

echo.
echo [3/3] Iniciando Tunel Publico (Acesso Mobile)...
echo Aguardando inicializacao do backend...
timeout /t 8 >nul
start "CafePoint Mobile Access" cmd /k "ssh -R cafepoint-final:80:127.0.0.1:5000 serveo.net"

echo.
echo ===================================================
echo    SISTEMA INICIADO COM SUCESSO!
echo ===================================================
echo 1. Acesso Local (Computador): http://localhost:5000
echo 2. Acesso Mobile (Celular):   Veja a URL na janela 'CafePoint Mobile Access'
echo                               (Ex: https://xxxx.serveo.net)
echo.
echo Mantenha as janelas abertas para o sistema funcionar.
echo.
pause
