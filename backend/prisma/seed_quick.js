const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Populando a base de dados (SaaS Mode - JS Quick)...');

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

    // Admin Restaurante
    let existingAdmin = await prisma.user.findFirst({
        where: { restaurantId: rId, role: 'ADMIN' }
    });

    if (!existingAdmin) {
        await prisma.user.create({
            data: {
                username: 'admin',
                password: passwordHash,
                name: 'Administrador',
                role: 'ADMIN',
                restaurantId: rId
            }
        });
    }

    // Super Admin Global
    let existingSuper = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    if (!existingSuper) {
        await prisma.user.create({
            data: {
                username: 'superadmin',
                password: passwordHash,
                name: 'Super Admin',
                role: 'SUPER_ADMIN'
                // restaurantId null
            }
        });
        console.log('✅ Super Admin criado (superadmin/admin123)');
    }

    console.log('✅ Seed finalizado com sucesso.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
