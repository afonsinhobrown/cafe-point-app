import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const username = 'admin';
    const password = 'admin123';
    const hashed = bcrypt.hashSync(password, 10);

    console.log(`Criando usuário: ${username}...`);

    await prisma.user.upsert({
        where: { username: username },
        update: {
            password: hashed,
            role: 'ADMIN'
        },
        create: {
            username: username,
            password: hashed,
            name: 'Administrador Sistema',
            role: 'ADMIN'
        }
    });

    console.log('✅ Usuário admin criado/atualizado com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
