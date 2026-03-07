const os = require('os');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Função para obter Machine ID (mesmo que o backend usa)
function getMachineId() {
    try {
        const hostname = os.hostname();
        const platform = os.platform();
        const arch = os.arch();
        const cpus = os.cpus()[0]?.model || 'generic';

        const combined = `${hostname}-${platform}-${arch}-${cpus}`;
        const hash = crypto.createHash('sha256').update(combined).digest('hex').toUpperCase();
        return hash.substring(0, 32);
    } catch (error) {
        return 'UNKNOWN_MACHINE_ID';
    }
}

// Ler licença atual
function readLicenseFile(filepath) {
    try {
        if (fs.existsSync(filepath)) {
            const content = fs.readFileSync(filepath, 'utf8');
            const decoded = Buffer.from(content, 'base64').toString('utf8');
            return JSON.parse(decoded);
        }
    } catch (error) {
        return null;
    }
}

console.log('\n' + '='.repeat(60));
console.log('🔍 VERIFICAÇÃO DE MACHINE ID E LICENÇA');
console.log('='.repeat(60) + '\n');

const currentMachineId = getMachineId();
console.log('📱 Machine ID ATUAL do sistema:');
console.log(`   ${currentMachineId}\n`);

// Verificar arquivos de licença
const licensePaths = [
    'cafe-point-license.dat',
    path.join(__dirname, 'cafe-point-license.dat'),
    path.join(process.env.APPDATA || '.', 'CafePoint', 'cafe-point-license.dat'),
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'CafePoint', 'cafe-point-license.dat')
];

console.log('📂 Procurando arquivo de licença em:');
let licenseData = null;
let licenseLocation = null;

for (const licensePath of licensePaths) {
    console.log(`   - ${licensePath}`);
    const data = readLicenseFile(licensePath);
    if (data) {
        licenseData = data;
        licenseLocation = licensePath;
        console.log(`     ✅ ENCONTRADO!\n`);
        break;
    }
}

if (licenseData) {
    console.log('📋 DADOS DA LICENÇA ENCONTRADA:');
    console.log(`   Localização: ${licenseLocation}`);
    console.log(`   Machine ID: ${licenseData.machineId || 'N/A'}`);
    console.log(`   Restaurant: ${licenseData.restaurantName || 'N/A'}`);
    console.log(`   Expiry Date: ${licenseData.expiryDate || 'N/A'}`);
    console.log(`   Status: ${licenseData.status || 'N/A'}\n`);

    if (licenseData.machineId === currentMachineId) {
        console.log('✅ SUCESSO! IDs CORRESPONDEM - Sistema desbloqueado\n');
    } else {
        console.log('❌ ERRO! IDs NÃO CORRESPONDEM');
        console.log(`   Machine ID esperado: ${licenseData.machineId}`);
        console.log(`   Machine ID atual:    ${currentMachineId}\n`);
        console.log('💡 SOLUÇÃO:');
        console.log('   Execute: node backend\\scripts\\gerar_licenca_local.ts');
        console.log('   Ou regenere a licença com o Machine ID acima.\n');
    }
} else {
    console.log('❌ NENHUM ARQUIVO DE LICENÇA ENCONTRADO!\n');
    console.log('💡 SOLUÇÃO:');
    console.log('   1. Acesse https://cafepoint.vercel.app/activate');
    console.log(`   2. Informe o Machine ID: ${currentMachineId}`);
    console.log('   3. Gere e baixe a licença');
    console.log('   4. Coloque o arquivo cafe-point-license.dat na raiz do projeto\n');
}

console.log('='.repeat(60) + '\n');
