@echo off
title INSTALADOR CAFEPOINT v1.0
color 0f
cd /d "%~dp0"

echo ===================================================
echo      INSTALADOR AUTOMATICO CAFEPOINT
echo ===================================================
echo.

:: DEFINIR VARIAVEL NODE_EXE
set "NODE_EXE=node"

:: 1. VERIFICAR NODE.JS
echo [1/4] Verificando Requisitos...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Node.js nao encontrado.
    echo.
    echo       INSTALANDO NODE.JS AUTOMATICAMENTE...
    echo       (Isto pode demorar 1-2 minutos)
    
    if exist "node_installer.msi" (
        msiexec /i "node_installer.msi" /qn /norestart check=default
        echo       Node.js instalado!
        
        :: Tentar encontrar onde ficou instalado para usar sem reiniciar
        if exist "C:\\Program Files\\nodejs\\node.exe" (
            set "NODE_EXE=C:\\Program Files\\nodejs\\node.exe"
        ) else (
            echo [ALERTA] Nao foi possivel encontrar o node.exe automaticamente.
            echo O instalador vai tentar continuar, mas pode falhar.
        )
    ) else (
        color 0c
        echo [ERRO] O instalador "node_installer.msi" nao foi encontrado no USB!
        pause
        exit
    )
) else (
    echo       Node.js ja esta instalado.
)

echo.
echo [2/4] Verificando Hardware...
wmic cpu get processorid
echo.

echo [3/4] Copiando Sistema para C:\\CafePoint...
if not exist "CafePointSystem" (
    color 0c
    echo [ERRO] Pasta "CafePointSystem" nao encontrada no USB!
    pause
    exit
)
xcopy /E /I /Y ".\\CafePointSystem" "C:\\CafePoint" >nul

echo.
echo [4/4] Configurando Base de Dados...
cd /d C:\\CafePoint\\backend

:: Tentar usar Node local recém-instalado ou existente
if exist "node_modules\\.bin\\prisma.cmd" (
    call node_modules\\.bin\\prisma.cmd generate
    call node_modules\\.bin\\prisma.cmd db push
) else (
    call npx prisma generate
    call npx prisma db push
)

echo.
echo [FINALIZANDO] ATIVANDO LICENCA...
cd /d "%~dp0"
"%NODE_EXE%" "%~dp0CafePointSystem\\backend\\dist\\activate.js"

echo.
echo ===================================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo ===================================================
echo Pode remover o USB agora.
pause
