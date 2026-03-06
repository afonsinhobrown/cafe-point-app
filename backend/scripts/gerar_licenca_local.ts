import { getMachineId, generateLicenseString } from '../src/utils/licenseManager';
import fs from 'fs';
import path from 'path';

// CONFIGURAÇÃO
const CLIENTE = "Desenvolvedor (Master)";
const DIAS = 3650; // 10 Anos

const getLicensePaths = () => {
    const appData = path.join(process.env.APPDATA || '', 'CafePoint', 'license.key');
    const programData = path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'CafePoint', 'license.key');
    const appDir = path.join(process.cwd(), '.license.key');
    return [appDir, appData, programData];
};

const gerarLocal = () => {
    console.log('🔓 GERADOR DE LICENÇA LOCAL (DEV)');
    console.log('=================================');

    // 1. Obter ID Real
    const machineId = getMachineId();
    console.log(`💻 ID da Máquina: ${machineId}`);

    // 2. Gerar Licença
    console.log(`⏳ Gerando licença válida por ${DIAS} dias...`);
    const licenseString = generateLicenseString(machineId, DIAS, CLIENTE);

    // 3. Gravar nos locais
    const paths = getLicensePaths();
    let successCount = 0;

    paths.forEach(p => {
        try {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(p, licenseString);
            console.log(`✅ Gravado em: ${p}`);
            successCount++;
        } catch (e: any) {
            console.error(`❌ Falha ao gravar em ${p}: ${e.message}`);
        }
    });

    if (successCount === 3) {
        console.log('\n✨ SUCESSO TOTAL! O sistema deve abrir agora.');
    } else {
        console.warn('\n⚠️ AVISO: A licença não foi gravada em todos os locais (falta de permissão?).');
        console.warn('Tente rodar o terminal como Administrador.');
    }
};

gerarLocal();
