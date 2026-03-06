import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Populando a base de dados (SaaS Mode)...');

    // 1. Criar Planos SaaS
    const plans = [
        { name: 'TRIAL', maxUsers: 5, maxTables: 10, maxItems: 50, monthlyPrice: 0 },
        { name: 'BASIC', maxUsers: 10, maxTables: 50, maxItems: 200, monthlyPrice: 29.90 },
        { name: 'PRO', maxUsers: 50, maxTables: 200, maxItems: 1000, monthlyPrice: 59.90 }
    ];

    for (const p of plans) {
        await prisma.plan.upsert({
            where: { name: p.name },
            update: { ...p },
            create: { ...p }
        });
    }
    console.log('✅ Planos SaaS criados.');

    const trialPlan = await prisma.plan.findUnique({ where: { name: 'TRIAL' } });

    // 2. Criar Restaurante Default (Seed)
    const restaurantName = 'Café Point Matriz';
    // Use findFirst because slug is unique
    let restaurant = await prisma.restaurant.findUnique({
        where: { slug: 'cafe-point-matriz' }
    });

    if (!restaurant) {
        restaurant = await prisma.restaurant.create({
            data: {
                name: restaurantName,
                slug: 'cafe-point-matriz',
                ownerName: 'Admin Seed',
                email: 'admin@cafepoint.com',
                status: 'ACTIVE'
            }
        });

        // Criar Licença
        if (trialPlan) {
            await prisma.license.create({
                data: {
                    restaurantId: restaurant.id,
                    planId: trialPlan.id,
                    status: 'ACTIVE'
                }
            });
        }
    }
    const rId = restaurant.id;
    console.log(`✅ Restaurante '${restaurantName}' (ID: ${rId}) garantido.`);

    // 3. Criar Usuários
    const passwordHash = await bcrypt.hash('admin123', 10);
    const superAdminPass = await bcrypt.hash('admin123', 10);

    // SUPER ADMIN (Global)
    const existingSuper = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!existingSuper) {
        await prisma.user.create({
            data: {
                username: 'superadmin',
                password: superAdminPass,
                name: 'Super Administrador',
                role: 'SUPER_ADMIN',
                // restaurantId: null opcional
            }
        });
        console.log('✅ Super Admin (Global) criado: superadmin/admin123');
    }

    // Admin Restaurante
    let adminUserId: number | undefined;

    const existingAdmin = await prisma.user.findFirst({
        where: {
            restaurantId: rId,
            role: 'ADMIN'
        }
    });

    if (!existingAdmin) {
        const newUser = await prisma.user.create({
            data: {
                username: 'admin',
                password: passwordHash,
                name: 'Administrador',
                role: 'ADMIN',
                restaurantId: rId
            }
        });
        adminUserId = newUser.id;
    } else {
        adminUserId = existingAdmin.id;
    }

    // Trial User
    const existingTrial = await prisma.user.findFirst({
        where: {
            restaurantId: rId,
            role: 'WAITER'
        }
    });

    if (!existingTrial) {
        await prisma.user.create({
            data: {
                username: 'trial',
                password: passwordHash,
                name: 'Usuário Demo',
                role: 'WAITER',
                restaurantId: rId
            }
        });
    }
    console.log('✅ Usuários vinculados ao restaurante.');

    // 4. Criar Localizações
    const locations = [
        { name: 'Salão Principal', description: 'Área interna com ar condicionado' },
        { name: 'Esplanada', description: 'Área externa para fumantes' }
    ];

    for (const l of locations) {
        await prisma.location.upsert({
            where: { name_restaurantId: { name: l.name, restaurantId: rId } },
            update: { description: l.description },
            create: {
                name: l.name,
                description: l.description,
                restaurantId: rId
            }
        });
    }

    const locInterna = await prisma.location.findUnique({ where: { name_restaurantId: { name: 'Salão Principal', restaurantId: rId } } });
    const locEsplanada = await prisma.location.findUnique({ where: { name_restaurantId: { name: 'Esplanada', restaurantId: rId } } });

    // 5. Criar Mesas
    const tablesData = [
        { number: 1, capacity: 2, locationId: locInterna?.id, type: 'BAR_COUNTER' },
        { number: 2, capacity: 4, locationId: locInterna?.id, type: 'TABLE_4' },
        { number: 3, capacity: 4, locationId: locInterna?.id, type: 'TABLE_4' },
        { number: 4, capacity: 6, locationId: locEsplanada?.id, type: 'TABLE_6' },
        { number: 5, capacity: 2, locationId: locEsplanada?.id, type: 'TABLE_2' }
    ];

    for (const t of tablesData) {
        if (!t.locationId) continue;
        await prisma.table.upsert({
            where: { number_restaurantId: { number: t.number, restaurantId: rId } },
            update: {},
            create: {
                number: t.number,
                capacity: t.capacity,
                locationId: t.locationId,
                type: t.type,
                status: 'AVAILABLE',
                restaurantId: rId
            }
        });
    }
    console.log('✅ Mesas criadas.');

    /* 
    // 6. Criar Itens do Menu (Temporariamente Desativado para garantir estabilidade do Seed Crítico)
    // ... código comentado ...
    */
    console.log('✅ Itens do menu (Pular)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());