import prisma from '../config/database';

export const checkTrialLimit = async (modelName: 'table' | 'location' | 'order' | 'menuItem' | 'stockMovement', restaurantId: number) => {
    // Buscar Licença Ativa com Plano
    const license = await prisma.license.findUnique({
        where: { restaurantId },
        include: { plan: true }
    });

    if (!license || license.status !== 'ACTIVE') {
        const hasAnyLicense = await prisma.license.findFirst({ where: { restaurantId } });
        if (!hasAnyLicense) return; // Permite (backwards compatibility) ou bloqueia? Melhor bloquear se for SaaS estrito.
        // Se tem licença mas não tiva, erro.
        throw new Error('Licença inativa ou expirada. Contate o suporte.');
    }

    const limits = license.plan;
    let count = 0;

    // TODO: Adicionar campos de limite no Model Plan se não exisitirem (Criamos maxTables, maxItems, maxUsers).
    // Pedidos e StockMovement geralmente não têm limite numérico hardcoded no plano (talvez limite mensal, complexo).

    switch (modelName) {
        case 'table':
            count = await prisma.table.count({ where: { restaurantId } });
            if (count >= limits.maxTables) {
                throw new Error(`Limite do plano atingido: Máximo ${limits.maxTables} mesas.`);
            }
            break;

        case 'menuItem':
            count = await prisma.menuItem.count({ where: { restaurantId } });
            if (count >= limits.maxItems) {
                throw new Error(`Limite do plano atingido: Máximo ${limits.maxItems} itens no menu.`);
            }
            break;

        // Adicionar outros casos conforme schema Plan
    }
};
