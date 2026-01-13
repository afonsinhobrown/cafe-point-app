import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Populando a base de dados...');

    // Criar mesas
    await prisma.table.createMany({
        data: [
            { number: 1, capacity: 2, location: 'INTERNA', type: 'BAR_COUNTER', status: 'AVAILABLE' },
            { number: 2, capacity: 4, location: 'INTERNA', type: 'TABLE_4', status: 'AVAILABLE' },
            { number: 3, capacity: 4, location: 'INTERNA', type: 'TABLE_4', status: 'AVAILABLE' },
            { number: 4, capacity: 6, location: 'ESPLANADA', type: 'TABLE_6', status: 'AVAILABLE' },
            { number: 5, capacity: 2, location: 'ESPLANADA', type: 'TABLE_2', status: 'AVAILABLE' },
            { number: 6, capacity: 4, location: 'ESPLANADA', type: 'TABLE_4', status: 'AVAILABLE' },
        ],
        skipDuplicates: true,
    });

    console.log('✅ Mesas criadas/confirmadas');

    // Criar usuário admin para desenvolvimento
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@cafepoint.local';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || '123456';

    const hashed = bcrypt.hashSync(adminPassword, 10);

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: hashed,
            name: 'Admin CafePoint',
            role: 'ADMIN'
        }
    });

    console.log(`✅ Usuário admin presente: ${adminEmail} (senha: ${adminPassword})`);

    // Criar alguns itens do menu
    const menuData = [
        { name: 'Café Expresso', description: 'Café forte e curto', price: 1.5, category: 'COFFEES', imageUrl: null },
        { name: 'Cappuccino', description: 'Café com espuma de leite', price: 2.5, category: 'COFFEES', imageUrl: null },
        { name: 'Croissant', description: 'Massa folhada amanteigada', price: 1.8, category: 'PASTRIES', imageUrl: null },
        { name: 'Sanduíche de Queijo', description: 'Pão, queijo e manteiga', price: 3.5, category: 'SANDWICHES', imageUrl: null },
        { name: 'Água Mineral', description: '500ml', price: 0.8, category: 'DRINKS', imageUrl: null }
    ];

    for (const item of menuData) {
        const exists = await prisma.menuItem.findFirst({ where: { name: item.name } });
        if (!exists) {
            await prisma.menuItem.create({
                data: {
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    category: item.category as any,
                    imageUrl: item.imageUrl,
                    isAvailable: true
                }
            });
        }
    }

    console.log('✅ Itens do menu criados/confirmados');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());