import { Request } from 'express';
import prisma from '../config/database';

export const checkTrialLimit = async (modelName: 'table' | 'location' | 'order' | 'menuItem' | 'stockMovement', userId: number) => {
    // Buscar usuário para ver se é trial
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.username !== 'trial') return;

    let count = 0;

    // Regras de Contagem
    // Para itens estruturais (Mesas, Áreas, Produtos), contamos o total do sistema
    // Para itens transacionais (Pedidos, Estoque), contamos apenas os do usuário (se possível) ou total

    switch (modelName) {
        case 'order':
            // Pedidos: Limite por usuário trial
            count = await prisma.order.count({ where: { userId } });
            break;
        case 'stockMovement':
            // Movimentos: Limite por usuário trial
            count = await prisma.stockMovement.count({ where: { userId } });
            break;
        case 'table':
            count = await prisma.table.count();
            break;
        case 'location':
            count = await prisma.location.count();
            break;
        case 'menuItem':
            count = await prisma.menuItem.count();
            break;
    }

    if (count >= 10) {
        throw new Error('Limite da Versão Trial atingido (Máx. 10 registros). Entre em contato para Upgrade.');
    }
};
