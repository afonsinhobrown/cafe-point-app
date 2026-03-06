import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('👑 Criando Super Admin...');

    try {
        const passwordHash = await bcrypt.hash('admin123', 10);

        // Tenta encontrar ou criar
        const user = await prisma.user.upsert({
            where: { id: 1 }, // Assume ID 1 para superadmin global
            update: {
                role: 'SUPER_ADMIN',
                password: passwordHash
            },
            create: {
                username: 'superadmin',
                password: passwordHash,
                name: 'Super Administrador',
                role: 'SUPER_ADMIN'
            }
        });

        console.log('✅ SUCESSO! Super Admin garantido.');
        console.log('👤 User: superadmin');
        console.log('🔑 Pass: admin123');

    } catch (e) {
        // Fallback se ID 1 já existir e for outro user (improvável em base limpa, mas possível)
        console.log('⚠️ Tentando método alternativo (findFirst)...');
        const exists = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

        if (!exists) {
            await prisma.user.create({
                data: {
                    username: 'superadmin',
                    password: await bcrypt.hash('admin123', 10),
                    name: 'Super Admin Rec',
                    role: 'SUPER_ADMIN'
                }
            });
            console.log('✅ SUCESSO! Super Admin criado no método alternativo.');
        } else {
            console.log('ℹ️ Super Admin já existe.');
        }
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
