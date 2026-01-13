import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const username = 'admin';
    const password = '123';
    const name = 'Administrador';

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await prisma.user.upsert({
        where: { username },
        update: {
            password: hashedPassword,
            name: name,
            role: 'ADMIN'
        },
        create: {
            username,
            password: hashedPassword,
            name,
            role: 'ADMIN'
        }
    });

    console.log('-----------------------------------');
    console.log('Credenciais criadas com sucesso:');
    console.log(`Username: ${username}`);
    console.log(`Senha: ${password}`);
    console.log('-----------------------------------');
}

main()
    .catch((e) => {
        console.error('Erro ao criar usuário:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
