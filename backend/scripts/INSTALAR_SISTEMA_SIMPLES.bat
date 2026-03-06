@echo off
title INSTALADOR CAFEPOINT v1.0
color 0f
cd /d "%~dp0"

echo ===================================================
echo      INSTALADOR CAFEPOINT
echo ===================================================
echo.

:: 1. VERIFICAR SE O CLIENTE JA INSTALOU O NODE
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0c
    echo [ERRO] O Node.js nao foi detectado!
    echo.
    echo 1. Na pasta deste USB, execute o arquivo "node_installer.msi"
    echo 2. Instale o Node.js (Next -> Next -> Finish)
    echo 3. Volte aqui e execute este instalador novamente.
    echo.
    pause
    exit
)

echo [OK] Node.js detectado.
echo.

echo 1. Verificando Hardware...
wmic cpu get processorid
echo.

echo 2. Copiando Sistema para C:\CafePoint...
if not exist "CafePointSystem" (
    color 0c
    echo [ERRO] Pasta "CafePointSystem" nao encontrada no USB!
    pause
    exit
)
xcopy /E /I /Y ".\CafePointSystem" "C:\CafePoint" >nul

echo.
echo 3. Configurando Base de Dados...
cd /d C:\CafePoint\backend

:: Usar binarios locais
if exist "node_modules\.bin\prisma.cmd" (
    call node_modules\.bin\prisma.cmd generate
    call node_modules\.bin\\prisma.cmd db push
) else (
    call npx prisma generate
    call npx prisma db push
)

echo.
echo 4. ATIVANDO LICENCA...
cd /d "%~dp0"
node "%~dp0CafePointSystem\backend\dist\activate.js"

echo.
echo 5. CRIANDO ATALHO NO DESKTOP...
:: Criar o ficheiro de arranque na pasta de instalação primeiro
echo @echo off > "C:\CafePoint\INICIAR_CAFEPOINT.bat"
echo title CAFE POINT SYSTEM >> "C:\CafePoint\INICIAR_CAFEPOINT.bat"
echo cd /d C:\CafePoint\backend >> "C:\CafePoint\INICIAR_CAFEPOINT.bat"
echo start "" "http://localhost:5000" >> "C:\CafePoint\INICIAR_CAFEPOINT.bat"
echo node dist/src/index.js >> "C:\CafePoint\INICIAR_CAFEPOINT.bat"
echo pause >> "C:\CafePoint\INICIAR_CAFEPOINT.bat"

:: Copiar para o Desktop
copy "C:\CafePoint\INICIAR_CAFEPOINT.bat" "%USERPROFILE%\Desktop\CAFEPOINT.bat" >nul
echo [OK] Atalho criado no Ambiente de Trabalho.

echo.
echo ===================================================
echo    INSTALACAO CONCLUIDA!
echo ===================================================
echo Pode remover o USB agora.
pause
