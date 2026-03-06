
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing Plan Limits...');

    // 1. Force Update Known Plans
    await prisma.plan.updateMany({
        where: { name: 'TRIAL' },
        data: { maxItems: 50, maxTables: 10, maxUsers: 5 }
    });

    await prisma.plan.updateMany({
        where: { name: 'BASIC' },
        data: { maxItems: 200, maxTables: 50, maxUsers: 10 }
    });

    await prisma.plan.updateMany({
        where: { name: 'PRO' },
        data: { maxItems: 1000, maxTables: 200, maxUsers: 50 }
    });

    console.log('✅ Standard plans updated.');

    // 2. Check Active License
    const licenses = await prisma.license.findMany({
        include: { plan: true, restaurant: true }
    });

    for (const l of licenses) {
        if (l.plan.maxItems === 0) {
            console.log(`⚠️ Found broken plan "${l.plan.name}" for restaurant "${l.restaurant.name}" with 0 items.`);

            await prisma.plan.update({
                where: { id: l.plan.id },
                data: { maxItems: 100 } // Give temporary quota
            });
            console.log(`✅ Fixed broken plan ID ${l.plan.id} -> maxItems: 100`);
        } else {
            console.log(`ℹ️ License for "${l.restaurant.name}" OK (Limit: ${l.plan.maxItems})`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
