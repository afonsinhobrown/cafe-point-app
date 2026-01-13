import { Request, Response } from 'express';
import prisma from '../config/database';
import { checkTrialLimit } from '../utils/trialLimits';

export const getStockMovements = async (req: Request, res: Response) => {
    try {
        const { menuItemId, type, startDate, endDate } = req.query;

        const where: any = {};
        if (menuItemId) where.menuItemId = parseInt(menuItemId as string);
        if (type) where.type = type;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const movements = await prisma.stockMovement.findMany({
            where,
            include: {
                menuItem: {
                    select: { name: true, category: true, brand: true }
                },
                supplier: true
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        res.json({
            success: true,
            data: movements
        });
    } catch (error) {
        console.error('Erro ao buscar movimentos de estoque:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const createManualMovement = async (req: Request, res: Response) => {
    try {
        const { menuItemId, quantity, type, reason, supplierId, purchasePrice, sellingPrice } = req.body;
        const userId = (req as any).user.id;

        // Verificar limite trial
        await checkTrialLimit('stockMovement', userId);

        const movement = await prisma.$transaction(async (tx) => {
            // Se for entrada (compra), opcionalmente atualizar os preços atuais do produto
            if (type === 'ENTRY' || type === 'ADJUSTMENT') {
                await tx.menuItem.update({
                    where: { id: parseInt(menuItemId) },
                    data: {
                        ...(purchasePrice && { costPrice: parseFloat(purchasePrice) }),
                        ...(sellingPrice && { price: parseFloat(sellingPrice) })
                    }
                });
            }

            // Criar movimento com rasto de preços
            const newMovement = await tx.stockMovement.create({
                data: {
                    menuItemId: parseInt(menuItemId),
                    quantity: parseInt(quantity),
                    type,
                    purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
                    sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
                    supplierId: supplierId ? parseInt(supplierId) : null,
                    reason,
                    userId
                }
            });

            // Atualizar o saldo no MenuItem
            await tx.menuItem.update({
                where: { id: parseInt(menuItemId) },
                data: {
                    stockQuantity: {
                        [type === 'ENTRY' ? 'increment' : 'decrement']: Math.abs(parseInt(quantity))
                    }
                }
            });

            return newMovement;
        });

        res.status(201).json({
            success: true,
            data: movement
        });
    } catch (error) {
        console.error('Erro ao criar movimento manual:', error);
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        const statusCode = message.includes('Trial') ? 403 : 500;

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};
