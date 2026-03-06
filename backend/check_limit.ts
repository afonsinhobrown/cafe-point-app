
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- CHECKING PLANS ---');
    const plans = await prisma.plan.findMany();
    console.table(plans);

    console.log('\n--- CHECKING LICENSES ---');
    const licenses = await prisma.license.findMany({
        include: {
            restaurant: { select: { name: true, slug: true } },
            plan: { select: { name: true, maxItems: true } }
        }
    });

    licenses.forEach(l => {
        console.log(`Rest: ${l.restaurant.name} | Plan: ${l.plan.name} | Limit: ${l.plan.maxItems} | Status: ${l.status}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
