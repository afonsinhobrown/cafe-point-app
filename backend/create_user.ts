import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const username = 'admin';
    const password = '123';
    const name = 'Administrador';

    // Garantir Restaurante
    let restaurant = await prisma.restaurant.findUnique({ where: { slug: 'cafe-point-matriz' } });
    if (!restaurant) {
        restaurant = await prisma.restaurant.create({
            data: {
                name: 'Café Point Matriz',
                slug: 'cafe-point-matriz',
                ownerName: 'SysAdmin',
                email: 'sysadmin@cafepoint.com',
                status: 'ACTIVE'
            }
        });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await prisma.user.upsert({
        where: { username_restaurantId: { username, restaurantId: restaurant.id } },
        update: {
            password: hashedPassword,
            name: name,
            role: 'ADMIN'
        },
        create: {
            username,
            password: hashedPassword,
            name,
            role: 'ADMIN',
            restaurantId: restaurant.id
        }
    });

    console.log('-----------------------------------');
    console.log('Credenciais criadas com sucesso (SaaS):');
    console.log(`Restaurant: ${restaurant.name}`);
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
