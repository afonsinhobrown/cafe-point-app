const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Machine ID atual (mesmo que detectou)
const CURRENT_MACHINE_ID = '6E2746C104B6224314C60F76C5047C2B';

function calculateChecksum(data) {
    return crypto.createHash('sha256')
        .update(JSON.stringify(data))
        .digest('hex')
        .toUpperCase()
        .substring(0, 32);
}

function generateLicense(machineId, days = 365, restaurantName = 'CafePoint') {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const licenseData = {
        machineId,
        restaurantName,
        expiryDate: expiryDate.toISOString(),
        createdAt: now.toISOString(),
        status: 'ACTIVE',
        checksum: ''
    };

    // Calcular checksum
    licenseData.checksum = calculateChecksum({
        machineId: licenseData.machineId,
        expiryDate: licenseData.expiryDate,
        restaurantName: licenseData.restaurantName
    });

    // Codificar em Base64
    const encoded = Buffer.from(JSON.stringify(licenseData)).toString('base64');

    return { licenseData, encoded };
}

console.log('\n' + '='.repeat(70));
console.log('🔐 GERANDO LICENÇA LOCAL');
console.log('='.repeat(70) + '\n');

const { licenseData, encoded } = generateLicense(CURRENT_MACHINE_ID, 365, 'Seu Restaurante');

console.log('📋 Dados da licença gerada:');
console.log(`   Machine ID: ${licenseData.machineId}`);
console.log(`   Restaurant: ${licenseData.restaurantName}`);
console.log(`   Expiry Date: ${licenseData.expiryDate}`);
console.log(`   Status: ${licenseData.status}`);
console.log(`   Checksum: ${licenseData.checksum}\n`);

// Salvar em 3 locais (como o sistema espera)
const locations = [
    'cafe-point-license.dat',
    path.join(process.env.APPDATA || '', 'CafePoint', 'cafe-point-license.dat'),
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'CafePoint', 'cafe-point-license.dat')
];

let saveCount = 0;

for (const location of locations) {
    try {
        const dir = path.dirname(location);

        // Criar diretório se não existir
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(location, encoded, 'utf8');
        console.log(`✅ Licença salva em: ${location}`);
        saveCount++;
    } catch (error) {
        console.log(`⚠️  Erro ao salvar em ${location}: ${error.message}`);
    }
}

console.log(`\n✅ ${saveCount} arquivo(s) de licença criado(s) com sucesso!\n`);
console.log('🎉 Sistema desbloqueado! Reinicie agora.\n');
console.log('='.repeat(70) + '\n');
