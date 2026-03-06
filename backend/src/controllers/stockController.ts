import { Request, Response } from 'express';
import prisma from '../config/database';
import { checkTrialLimit } from '../utils/trialLimits';
import { AuthRequest } from '../middleware/auth';

export const getStockMovements = async (req: Request, res: Response) => {
    try {
        const { menuItemId, type, startDate, endDate } = req.query;
        const user = (req as any).user;
        const restaurantId = user.restaurantId;

        if (!restaurantId) return res.status(401).json({ success: false, message: 'Acesso negado' });

        const where: any = { restaurantId };
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
        const { menuItemId, quantity, type, reason, supplierId, purchasePrice, sellingPrice, lotNumber } = req.body;
        const user = (req as any).user;
        const restaurantId = user.restaurantId;

        if (!restaurantId) return res.status(403).json({ success: false, message: 'Restaurante não identificado' });

        // Ensure menuItem belongs to tenant
        const menuItem = await prisma.menuItem.findFirst({
            where: { id: parseInt(menuItemId), restaurantId }
        });
        if (!menuItem) return res.status(404).json({ success: false, message: 'Item não encontrado' });

        // Verificar limite trial
        await checkTrialLimit('stockMovement', restaurantId);

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

            // Criar movimento com rasto de preços e lote
            const newMovement = await tx.stockMovement.create({
                data: {
                    restaurantId,
                    menuItemId: parseInt(menuItemId),
                    quantity: parseInt(quantity),
                    type,
                    purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
                    sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
                    lotNumber: lotNumber || null,
                    supplierId: supplierId ? parseInt(supplierId) : null,
                    reason,
                    userId: user.id
                }
            });

            // Atualizar o saldo no MenuItem
            await tx.menuItem.update({
                where: { id: parseInt(menuItemId) },
                data: {
                    stockQuantity: {
                        [type === 'ENTRY' || type === 'ADJUSTMENT' && parseInt(quantity) > 0 ? 'increment' : 'decrement']: Math.abs(parseInt(quantity))
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
        const statusCode = message.includes('Limite') ? 403 : 500;

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};
