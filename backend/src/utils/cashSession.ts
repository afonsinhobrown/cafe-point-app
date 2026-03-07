import prisma from '../config/database';

export const getOpenCashSession = async (restaurantId: number) => {
    return prisma.cashSession.findFirst({
        where: {
            restaurantId,
            status: 'OPEN',
            closedAt: null
        },
        orderBy: { openedAt: 'desc' }
    });
};

export const ensureCashSessionOpen = async (restaurantId: number) => {
    const session = await getOpenCashSession(restaurantId);
    if (!session) {
        throw new Error('Caixa fechado. Abra o caixa para continuar.');
    }
    return session;
};

export const calculateCashSessionBalance = async (cashSessionId: number, openingBalance: number) => {
    const movements = await prisma.cashMovement.findMany({
        where: { cashSessionId },
        select: { amount: true }
    });

    const movementTotal = movements.reduce((sum, movement) => sum + movement.amount, 0);
    return openingBalance + movementTotal;
};
