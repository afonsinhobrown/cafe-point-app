@echo off
echo ========================================
echo   SUBINDO CODIGO PARA O GITHUB
echo ========================================
echo.

REM Inicializar Git (se ainda nao foi)
git init

REM Adicionar todos os arquivos
git add .

REM Fazer commit
git commit -m "Initial commit - Cafe Point App"

REM IMPORTANTE: Substitua a URL abaixo pela URL do seu repositorio
echo.
echo ATENCAO: Abra este arquivo e substitua a URL do repositorio!
echo Exemplo: git remote add origin https://github.com/SEU-USUARIO/cafe-point-app.git
echo.
pause

REM Adicionar remote (SUBSTITUA PELA SUA URL)
git remote add origin https://github.com/SEU-USUARIO/cafe-point-app.git

REM Fazer push
git branch -M main
git push -u origin main

echo.
echo ========================================
echo   CODIGO ENVIADO COM SUCESSO!
echo ========================================
pause
