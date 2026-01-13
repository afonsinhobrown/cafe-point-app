import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Populando a base de dados...');

    // 1. Criar Localizações (Areas)
    const locInterna = await prisma.location.upsert({
        where: { name: 'Salão Principal' },
        update: {},
        create: { name: 'Salão Principal', description: 'Área interna com ar condicionado' }
    });

    const locEsplanada = await prisma.location.upsert({
        where: { name: 'Esplanada' },
        update: {},
        create: { name: 'Esplanada', description: 'Área externa para fumantes' }
    });

    // 2. Criar Mesas
    // Precisamos checar se já existem para evitar duplicidade de números únicos
    const tablesData = [
        { number: 1, capacity: 2, locationId: locInterna.id, type: 'BAR_COUNTER' },
        { number: 2, capacity: 4, locationId: locInterna.id, type: 'TABLE_4' },
        { number: 3, capacity: 4, locationId: locInterna.id, type: 'TABLE_4' },
        { number: 4, capacity: 6, locationId: locEsplanada.id, type: 'TABLE_6' },
        { number: 5, capacity: 2, locationId: locEsplanada.id, type: 'TABLE_2' },
        { number: 6, capacity: 4, locationId: locEsplanada.id, type: 'TABLE_4' },
    ];

    for (const t of tablesData) {
        await prisma.table.upsert({
            where: { number: t.number },
            update: {},
            create: {
                number: t.number,
                capacity: t.capacity,
                locationId: t.locationId,
                type: t.type as any,
                status: 'AVAILABLE'
            }
        });
    }

    console.log('✅ Mesas e Áreas criadas.');

    // 3. Criar Usuários (Admin e Trial)
    const passwordHash = await bcrypt.hash('admin123', 10);
    const trialHash = await bcrypt.hash('trial123', 10);

    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: passwordHash,
            name: 'Administrador',
            role: 'ADMIN'
        }
    });

    await prisma.user.upsert({
        where: { username: 'trial' },
        update: {},
        create: {
            username: 'trial',
            password: trialHash,
            name: 'Usuário Demo',
            role: 'ADMIN'
        }
    });

    console.log('✅ Usuários admin e trial criados.');

    // 4. Criar Itens do Menu
    const menuData = [
        { name: 'Café Expresso', description: 'Café forte e curto', price: 60, costPrice: 20, category: 'Bebidas', stock: 100 },
        { name: 'Cappuccino', description: 'Café com espuma de leite', price: 120, costPrice: 40, category: 'Bebidas', stock: 50 },
        { name: 'Croissant Simples', description: 'Massa folhada', price: 80, costPrice: 30, category: 'Comida', stock: 20 },
        { name: 'Sanduíche Misto', description: 'Fiambre e Queijo', price: 150, costPrice: 60, category: 'Comida', stock: 30 },
        { name: 'Água Mineral', description: '500ml', price: 40, costPrice: 15, category: 'Bebidas', stock: 200 }
    ];

    for (const item of menuData) {
        const menuItem = await prisma.menuItem.findFirst({ where: { name: item.name } });
        if (!menuItem) {
            const newItem = await prisma.menuItem.create({
                data: {
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    costPrice: item.costPrice,
                    category: item.category,
                    stockQuantity: item.stock, // Estoque Inicial
                    isAvailable: true
                }
            });

            // Registar movimento de stock inicial
            await prisma.stockMovement.create({
                data: {
                    menuItemId: newItem.id,
                    quantity: item.stock,
                    type: 'ADJUSTMENT',
                    reason: 'Seed Inicial',
                    purchasePrice: item.costPrice,
                    sellingPrice: item.price,
                    userId: 1 // Assume admin ID 1
                }
            });
        }
    }

    console.log('✅ Itens do menu criados.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());