const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('👑 Criando Super Admin (JS Mode)...');

    try {
        const passwordHash = await bcrypt.hash('admin123', 10);

        // Verifica se existe
        let user = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' }
        });

        if (!user) {
            // Tenta criar
            await prisma.user.create({
                data: {
                    username: 'superadmin',
                    password: passwordHash,
                    name: 'Super Administrador',
                    role: 'SUPER_ADMIN'
                }
            });
            console.log('✅ SUCESSO! Super Admin criado.');
        } else {
            // Atualiza senha para garantir
            await prisma.user.update({
                where: { id: user.id },
                data: { password: passwordHash }
            });
            console.log('✅ Super Admin atualizado com senha padrão.');
        }

    } catch (e) {
        console.error('ERRO:', e);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
