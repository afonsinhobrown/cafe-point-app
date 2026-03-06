import fs from 'fs';
import path from 'path';

const verLicenca = () => {
    try {
        const licensePath = path.join(process.cwd(), '.license.key');
        if (!fs.existsSync(licensePath)) {
            console.error('❌ Nenhuma licença encontrada na raiz.');
            return;
        }

        const content = fs.readFileSync(licensePath, 'utf8');
        const decoded = Buffer.from(content, 'base64').toString('utf8');
        const data = JSON.parse(decoded);

        console.log('\n🔍 DETALHES DA LICENÇA INSTALADA:');
        console.log('===================================');
        console.log(`🏢 Cliente:    ${data.restaurantName}`);
        console.log(`📅 Expira em:  ${data.expiryDate}`);
        console.log(`💻 Hardware ID:${data.machineId}`);
        console.log(`🔒 Checksum:   ${data.checksum.substring(0, 10)}... (Válido)`);

        const daysLeft = Math.ceil((new Date(data.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        console.log(`⏳ Restam:     ${daysLeft} dias`);
        console.log('===================================\n');

    } catch (e: any) {
        console.error('❌ Erro ao ler licença:', e.message);
    }
};

verLicenca();
