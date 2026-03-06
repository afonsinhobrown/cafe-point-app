import { getMachineId, generateLicenseString } from './src/utils/licenseManager';
import { decrypt, encrypt } from './src/utils/cryptoBox';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const getLicensePaths = () => {
    const appData = path.join(process.env.APPDATA || '', 'CafePoint', 'license.key');
    const programData = path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'CafePoint', 'license.key');
    const appDir = path.join(process.cwd(), '.license.key');
    // NOVO: Garantir que fica também dentro da pasta backend (onde o servidor corre)
    const backendDir = path.join(process.cwd(), 'backend', '.license.key');
    return [appDir, backendDir, appData, programData];
};

const isUSBDevice = (currentPath: string): boolean => {
    try {
        const driveLetter = currentPath.substring(0, 2); // Ex: "E:"
        const output = execSync(`wmic logicaldisk where "deviceid='${driveLetter}'" get drivetype`).toString();
        // DriveType 2 = Removable (USB), 3 = Local Disk
        return output.includes('2');
    } catch (e) {
        return false;
    }
};

const activate = () => {
    console.log('\n🛡️  CAFEPOINT SECURE INSTALLER');
    console.log('='.repeat(40));

    const currentDir = process.cwd();

    // 🛡️ 0. Verificar flag --dev
    const isDevMode = process.argv.includes('--dev');

    if (isDevMode) {
        console.log('⚠️  MODO DE DESENVOLVIMENTO (DEV) ATIVADO');
        console.log('    Ignorando verificações de USB e contadores.');

        const devParamsPath = path.join(__dirname, 'scripts', 'license_params.dat');
        if (!fs.existsSync(devParamsPath)) {
            console.error('❌ ERRO: Ficheiro license_params.dat não encontrado em backend/scripts.');
            process.exit(1);
        }

        try {
            const config = JSON.parse(decrypt(fs.readFileSync(devParamsPath, 'utf8')));
            console.log(`📝 Ativando para: ${config.client} (${config.days_limit} dias)`);

            const machineId = getMachineId();
            const licenseString = generateLicenseString(machineId, config.days_limit, config.client);

            getLicensePaths().forEach(p => {
                const dir = path.dirname(p);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(p, licenseString);
                console.log(`✅ Licença instalada em: ${p}`);
            });

            console.log('\n✅ ATIVAÇÃO DEV CONCLUÍDA!');
            process.exit(0);
        } catch (e: any) {
            console.error('❌ Erro na ativação DEV:', e.message);
            process.exit(1);
        }
    }

    // 🛡️ 1. Verificar se está a correr de um USB
    // EM DESENVOLVIMENTO: Se o ficheiro de licença estiver na pasta scripts, permitimos
    const devParamsPath = path.join(__dirname, 'scripts', 'license_params.dat');
    const usbParamsPath = path.join(currentDir, 'license_params.dat');

    let activeParamsPath = usbParamsPath;

    if (fs.existsSync(devParamsPath) && !isUSBDevice(currentDir)) {
        // Auto-detect dev environment but enforce tracking if not explicitly skipped
        activeParamsPath = devParamsPath;
        console.log('⚠️ Ambiente DEV detectado (usando scripts locals)...');
    } else if (!isUSBDevice(currentDir)) {
        console.error('🛑 ERRO: Instalação bloqueada. O instalador deve ser executado a partir de um dispositivo USB removível.');
        process.exit(1);
    }

    // 🛡️ 2. Verificar ficheiros de rastreio (4 ficheiros)
    const trackerFiles = [".sys_vol", ".device_map", "kernel.dat", ".tracker_v1"];
    const foundData: any[] = [];

    // Determine base path for trackers
    const trackerBasePath = activeParamsPath === devParamsPath ? path.dirname(devParamsPath) : currentDir;

    for (const f of trackerFiles) {
        const p = path.join(trackerBasePath, f);
        if (!fs.existsSync(p)) {
            console.error(`❌ ERRO: Ficheiro de proteção corrompido ou em falta: ${f}`);
            process.exit(1);
        }
        try {
            const raw = fs.readFileSync(p, 'utf8');
            const decrypted = JSON.parse(decrypt(raw));
            foundData.push({ path: p, data: decrypted });
        } catch (e) {
            console.error(`❌ ERRO: Falha na integridade do ficheiro ${f}`);
            process.exit(1);
        }
    }

    // 🛡️ 3. Validar se os 4 ficheiros dizem a mesma coisa
    const limits = foundData.map(d => d.data.limit);
    if (new Set(limits).size > 1) {
        console.error('🛑 ERRO: Tentativa de fraude detectada nos contadores de instalação.');
        process.exit(1);
    }

    const currentLimit = limits[0];
    if (currentLimit <= 0) {
        console.error('🛑 ERRO: Limite de instalações atingido para este dispositivo USB.');
        process.exit(1);
    }

    console.log(`📡 Dispositivo USB validado. Instalações restantes: ${currentLimit}`);

    try {
        if (!fs.existsSync(activeParamsPath)) {
            console.error('❌ ERRO: Parâmetros de licença não encontrados.');
            process.exit(1);
        }

        const config = JSON.parse(decrypt(fs.readFileSync(activeParamsPath, 'utf8')));

        // 🛡️ NOVO: Verificar Validade do PROPRIO INSTALADOR (Segurança contra cópia)
        if (config.installer_expires) {
            const expireDate = new Date(config.installer_expires);
            const today = new Date();
            // Resetar horas para comparar apenas datas
            expireDate.setHours(23, 59, 59, 999);

            if (today > expireDate) {
                console.error('🛑 ERRO DE SEGURANÇA: Este pacote de instalação EXPIROU.');
                console.error(`   Válido até: ${config.installer_expires}`);
                console.error('   Contacte o fornecedor para obter um novo instalador.');
                process.exit(1);
            }
        }

        console.log(`📝 Ativando para: ${config.client}`);

        // 4. Gerar e Distribuir Licença
        const machineId = getMachineId();
        const licenseString = generateLicenseString(machineId, config.days_limit, config.client);

        getLicensePaths().forEach(p => {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(p, licenseString);
        });

        // 🛡️ 5. ATUALIZAR CONTADORES NO USB (Consumir 1 instalação)
        const nextLimit = currentLimit - 1;
        foundData.forEach(f => {
            const updated = { ...f.data, limit: nextLimit };

            // Atualizar ficheiro (Sem floreados de ocultar/desocultar)
            try {
                fs.writeFileSync(f.path, encrypt(JSON.stringify(updated)));
            } catch (e) {
                console.error(`⚠️ Erro ao atualizar contador em ${f.path}`);
            }
        });

        console.log('\n✅ SISTEMA INSTALADO E ATIVADO COM SUCESSO!');
        console.log(`Slots de instalação restantes no USB: ${nextLimit}`);
        console.log(`ID de Hardware: ${machineId}`);

    } catch (error: any) {
        console.error('❌ Falha Crítica:', error.message);
    }
};

activate();
