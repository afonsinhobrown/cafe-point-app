import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = path.resolve(__dirname, '../..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// SAÍDAS
const OUTPUT_INSTALLER = path.resolve(ROOT_DIR, '../cafepoint-installer');
const OUTPUT_TOOLS = path.resolve(ROOT_DIR, '../cafepoint-tools');

console.log('📦 A PREPARAR KIT DE INSTALAÇÃO USB (MODO SIMPLES)...');
console.log(`📂 INSTALLER: ${OUTPUT_INSTALLER}`);
console.log(`📂 TOOLS:     ${OUTPUT_TOOLS}`);
console.log('='.repeat(50));

// 1. Limpar Outputs Anteriores
[OUTPUT_INSTALLER, OUTPUT_TOOLS].forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`🗑️  Limpando ${path.basename(dir)}...`);
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { }
    }
    fs.mkdirSync(dir, { recursive: true });
});

try {
    // ========================================================
    // PASTA 1: CAFEPOINT-INSTALLER (O que vai para o USB)
    // ========================================================

    // 2. Copiar Sistema (CafePointSystem)
    const appDir = path.join(OUTPUT_INSTALLER, 'CafePointSystem');
    fs.mkdirSync(appDir, { recursive: true });

    // --- RECOMPILAR BACKEND (CRÍTICO PARA APLICAR CORREÇÕES) ---
    console.log('🔨 Compilando Backend (TypeScript -> JavaScript)...');
    try {
        execSync('npm run build', { cwd: BACKEND_DIR, stdio: 'inherit' });
    } catch (e) {
        console.error('⚠️ Aviso: Falha ao compilar backend. Usando versão antiga se existir.');
    }
    // -----------------------------------------------------------

    // Copiar Backend
    console.log('📂 [Installer] Copiando Backend e Dependências...');
    const backendDest = path.join(appDir, 'backend');
    fs.mkdirSync(backendDest, { recursive: true });

    fs.copyFileSync(path.join(BACKEND_DIR, 'package.json'), path.join(backendDest, 'package.json'));

    // Copiar node_modules e dist
    fs.cpSync(path.join(BACKEND_DIR, 'node_modules'), path.join(backendDest, 'node_modules'), { recursive: true });
    fs.cpSync(path.join(BACKEND_DIR, 'dist'), path.join(backendDest, 'dist'), { recursive: true });
    fs.cpSync(path.join(BACKEND_DIR, 'prisma'), path.join(backendDest, 'prisma'), { recursive: true });

    // Copiar Frontend
    console.log('📂 [Installer] Copiando Frontend para DIST...');
    // MUDANÇA: Copiar para dentro de DIST para evitar erros de caminho relativo
    const publicDest = path.join(backendDest, 'dist', 'public');
    fs.mkdirSync(publicDest, { recursive: true });
    if (fs.existsSync(path.join(FRONTEND_DIR, 'dist'))) {
        fs.cpSync(path.join(FRONTEND_DIR, 'dist'), publicDest, { recursive: true });
    }

    // 3. Baixar Node.js
    console.log('⬇️  [Installer] Baixando Node.js Instalador...');
    const nodeMsiPath = path.join(OUTPUT_INSTALLER, 'node_installer.msi');
    try {
        execSync(`powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '${nodeMsiPath}'"`, { stdio: 'inherit' });
    } catch (e) {
        console.warn('⚠️ Falha ao baixar Node.js. Coloque manualmente.');
    }

    // 4. CRIAR INSTALAR_SISTEMA.BAT
    console.log('🔨 [Installer] Criando INSTALAR_SISTEMA.bat...');
    const setupBatContent = `@echo off
title INSTALADOR CAFEPOINT v3.0
color 0f
cd /d "%~dp0"

echo ===================================================
echo      INSTALADOR AUTOMATICO CAFEPOINT
echo ===================================================
echo.

:: 1. VERIFICAR NODE.JS
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [AVISO] Node.js nao detectado.
    echo.
    echo 1. Por favor, instale o ficheiro "node_installer.msi" que esta nesta pasta.
    echo 2. Volte a executar este ficheiro depois.
    echo.
    pause
    exit
)

echo [OK] Node.js detectado.
echo.

echo 2. Copiando Sistema para C:\\CafePoint...
if not exist "CafePointSystem" (
    color 0c
    echo [ERRO] Pasta "CafePointSystem" nao encontrada!
    pause
    exit
)
xcopy /E /I /Y ".\\CafePointSystem" "C:\\CafePoint" >nul

echo 3. Configurando Base de Dados...
cd /d C:\\CafePoint\\backend
if exist "node_modules\\.bin\\prisma.cmd" (
    call node_modules\\.bin\\prisma.cmd generate
    call node_modules\\.bin\\prisma.cmd db push
) else (
    call npx prisma generate
    call npx prisma db push
)

echo 4. Ativando Licenca...
cd /d "%~dp0"
node "%~dp0CafePointSystem\\backend\\dist\\activate.js"

if %errorlevel% neq 0 (
    color 0c
    echo.
    echo ===================================================
    echo [ERRO CRITICO] A ATIVACAO FALHOU!
    echo ===================================================
    echo Motivo possivel:
    echo  - Limite de instalacoes do USB atingido.
    echo  - Pen Drive nao detectada ou ficheiros corrompidos.
    echo.
    echo A instalacao foi ABORTADA. O sistema nao vai funcionar.
    echo Contacte o suporte tecnico.
    pause
    exit
)

echo 5. Criando Atalho no Desktop...
echo @echo off > "C:\\CafePoint\\INICIAR_PRODUCAO.bat"
echo title CAFE POINT SYSTEM >> "C:\\CafePoint\\INICIAR_PRODUCAO.bat"
echo cd /d C:\\CafePoint\\backend >> "C:\\CafePoint\\INICIAR_PRODUCAO.bat"
echo start "" "http://localhost:5000" >> "C:\\CafePoint\\INICIAR_PRODUCAO.bat"
echo node dist/src/index.js >> "C:\\CafePoint\\INICIAR_PRODUCAO.bat"
echo pause >> "C:\\CafePoint\\INICIAR_PRODUCAO.bat"

copy /Y "C:\\CafePoint\\INICIAR_PRODUCAO.bat" "%USERPROFILE%\\Desktop\\CAFEPOINT.bat" >nul

echo.
echo ===================================================
echo    INSTALACAO CONCLUIDA COM SUCESSO!
echo ===================================================
echo O sistema esta pronto. Pode clicar no icone "CAFEPOINT" no Desktop.
pause
`;
    fs.writeFileSync(path.join(OUTPUT_INSTALLER, 'INSTALAR_SISTEMA.bat'), setupBatContent);


    // ========================================================
    // PASTA 2: CAFEPOINT-TOOLS (Para TI)
    // ========================================================
    console.log('\n🛠️  [Tools] Configurando Ferramentas do Técnico...');

    // Copiar scripts Python Essenciais
    const scriptsToCopy = ['gen_license_encrypted.py', 'read_secret.py'];
    for (const s of scriptsToCopy) {
        fs.copyFileSync(path.join(BACKEND_DIR, 'scripts', s), path.join(OUTPUT_TOOLS, s));
    }

    // FERRAMENTA 1: CONFIGURADOR MESTRE (Licença + Instalações)
    const genLicenseBat = `@echo off
title CONFIGURADOR MESTRE CAFEPOINT
color 0e
cd /d "%~dp0"
echo ===========================================
echo   CONFIGURADOR MESTRE (DIAS + INSTALLAÇOES)
echo ===========================================
echo.
python gen_license_encrypted.py
pause
`;
    fs.writeFileSync(path.join(OUTPUT_TOOLS, 'CONFIGURAR_USB.bat'), genLicenseBat);

    // FERRAMENTA 2: LER LOGS
    const readUsbBat = `@echo off
title LER PEN DRIVE
color 08
cd /d "%~dp0"
echo Arraste o ficheiro .sys_vol da Pen para aqui...
python read_secret.py
pause
`;
    fs.writeFileSync(path.join(OUTPUT_TOOLS, 'LER_LOGS.bat'), readUsbBat);

    console.log('\n✅ BUILD COMPLETO COM SUCESSO!');
    console.log('---------------------------------------------------');
    console.log('1. Copie a pasta [cafepoint-installer] para o USB.');
    console.log('2. Abra a pasta [cafepoint-tools] no seu PC e execute CONFIGURAR_USB.bat');
    console.log('---------------------------------------------------');

} catch (e: any) {
    console.error('❌ ERRO:', e.message);
}
