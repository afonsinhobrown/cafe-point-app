import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanNames() {
    console.log("🧹 Iniciando limpeza de nomes de dispositivos...");
    const devices = await prisma.device.findMany();

    let count = 0;
    for (const dev of devices) {
        // Se o nome for muito longo e parecer um User Agent
        if (dev.name.length > 40 && dev.name.includes('Mozilla')) {
            let newName = 'Dispositivo Web';

            if (dev.name.includes('Windows')) newName = 'PC Windows';
            else if (dev.name.includes('Android')) newName = 'Tablet Android';
            else if (dev.name.includes('iPhone')) newName = 'iPhone';
            else if (dev.name.includes('iPad')) newName = 'iPad';
            else if (dev.name.includes('Macintosh')) newName = 'Mac';
            else if (dev.name.includes('Linux')) newName = 'PC Linux';

            // Adiciona o ID para garantir unicidade visual
            newName = `${newName} #${dev.id}`;

            console.log(`✏️ Renomeando ID ${dev.id}: \n   De: "${dev.name.substring(0, 30)}..." \n   Para: "${newName}"`);

            await prisma.device.update({
                where: { id: dev.id },
                data: { name: newName }
            });
            count++;
        }
    }
    console.log(`✅ Limpeza concluída! ${count} dispositivos atualizados.`);
}

cleanNames()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
