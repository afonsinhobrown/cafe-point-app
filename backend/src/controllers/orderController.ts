import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { checkTrialLimit } from '../utils/trialLimits';
import { ensureCashSessionOpen } from '../utils/cashSession';

export const createOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { tableId, items } = req.body;
        const userId = req.user?.id;
        const restaurantId = req.user?.restaurantId;

        if (!userId || !restaurantId) {
            return res.status(401).json({ success: false, message: 'Autenticação inválida' });
        }

        console.log(`[ORDER SEC] User ${req.user?.username} (Rest: ${restaurantId}) ordering items: ${JSON.stringify(items)}`);

        // Verificar limite trial
        await checkTrialLimit('order', restaurantId);

        // Verificar se a mesa existe e pertence ao restaurante
        const table = await prisma.table.findFirst({
            where: { id: tableId, restaurantId }
        });

        if (!table) return res.status(404).json({ success: false, message: 'Mesa não encontrada ou acesso negado' });

        // Buscar preços dos itens do menu (Validar pertencimento ao restaurante)
        const menuItems = await prisma.menuItem.findMany({
            where: {
                restaurantId,
                isAvailable: true
            },
            include: {
                recipeIngredients: {
                    include: { ingredient: true }
                }
            }
        });

        // Verificar se todos os itens existem
        const invalidItems = items.filter((item: any) =>
            !menuItems.find(mi => mi.id === item.menuItemId)
        );

        if (invalidItems.length > 0) {
            return res.status(400).json({ success: false, message: 'Alguns itens não existem ou não são deste restaurante' });
        }

        // Verificar Estoque (Bebidas e Ingredientes)
        for (const item of items) {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
            if (!menuItem) continue;

            const quantityNeeded = item.quantity;

            // Caso 1: Item Simples com Estoque Controlado (ex: Bebida)
            if (menuItem.itemType === 'PRODUCT' && menuItem.stockQuantity !== null) {
                if (menuItem.stockQuantity < quantityNeeded) {
                    return res.status(400).json({
                        success: false,
                        message: `Estoque insuficiente para: ${menuItem.name}`
                    });
                }
            }

            // Caso 2: Prato Composto (Ingredientes)
            if (menuItem.itemType === 'DISH' && menuItem.recipeIngredients?.length > 0) {
                for (const recipeItem of menuItem.recipeIngredients) {
                    const ingredient = recipeItem.ingredient;
                    const totalIngredientNeeded = recipeItem.quantity * quantityNeeded;

                    if (ingredient && ingredient.stockQuantity !== null && ingredient.stockQuantity < totalIngredientNeeded) {
                        return res.status(400).json({
                            success: false,
                            message: `Estoque insuficiente de ingrediente (${ingredient.name}) para: ${menuItem.name}`
                        });
                    }
                }
            }
        }

        const totalAmount = items.reduce((total: number, item: any) => {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
            return total + (menuItem?.price || 0) * item.quantity;
        }, 0);

        // Transaction
        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    restaurantId,
                    tableId,
                    userId,
                    totalAmount,
                    orderItems: {
                        create: items.map((item: any) => ({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            notes: item.notes || '',
                            price: menuItems.find(mi => mi.id === item.menuItemId)?.price || 0,
                            course: item.course || 'MAIN'
                        }))
                    }
                },
                include: {
                    table: { include: { location: true } },
                    user: { select: { id: true, name: true, username: true } },
                    orderItems: {
                        include: {
                            menuItem: { select: { id: true, name: true, price: true, category: true } }
                        }
                    }
                }
            });

            // Baixa no Estoque
            // Baixa no Estoque
            for (const item of items) {
                const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                if (!menuItem) continue;

                const quantitySold = item.quantity;

                // Baixa Direta (PRODUCT)
                if (menuItem.itemType === 'PRODUCT' && menuItem.stockQuantity !== null) {
                    await tx.menuItem.update({
                        where: { id: menuItem.id },
                        data: { stockQuantity: { decrement: quantitySold } }
                    });

                    await tx.stockMovement.create({
                        data: {
                            restaurantId,
                            menuItemId: menuItem.id,
                            quantity: -quantitySold,
                            type: 'EXIT_SALE',
                            reason: `Venda Pedido #${newOrder.id}`,
                            userId
                        }
                    });
                }

                // Baixa Ingredientes (DISH)
                if (menuItem.itemType === 'DISH' && menuItem.recipeIngredients?.length > 0) {
                    for (const recipeItem of menuItem.recipeIngredients) {
                        const ingredient = recipeItem.ingredient;
                        const totalIngredientUsed = recipeItem.quantity * quantitySold;

                        if (ingredient && ingredient.stockQuantity !== null) {
                            await tx.menuItem.update({
                                where: { id: ingredient.id },
                                data: { stockQuantity: { decrement: totalIngredientUsed } }
                            });

                            await tx.stockMovement.create({
                                data: {
                                    restaurantId,
                                    menuItemId: ingredient.id,
                                    quantity: -totalIngredientUsed,
                                    type: 'EXIT_SALE',
                                    reason: `Receita: ${menuItem.name} (#${newOrder.id})`,
                                    userId
                                }
                            });
                        }
                    }
                }
            }
            return newOrder;
        });

        // Socket IO (Namespace por tenant no futuro)
        const io = (req as any).io;
        if (io) io.emit('newOrder', order); // Ideal: .to(`restaurant-${restaurantId}`)

        await prisma.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED' }
        });

        res.status(201).json({ success: true, data: order });

    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        const message = error instanceof Error ? error.message : 'Erro interno';
        const statusCode = message.includes('Limited') ? 403 : 500;
        res.status(statusCode).json({ success: false, message });
    }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
    try {
        const { status, tableId } = req.query;
        const restaurantId = req.user?.restaurantId;

        if (!restaurantId) return res.status(401).json({ success: false, message: 'Acesso negado' });

        const whereClause: any = { restaurantId }; // Filter by Tenant

        if (status) {
            if (typeof status === 'string') {
                whereClause.status = { in: status.split(',') };
            }
        }

        if (tableId) {
            whereClause.tableId = parseInt(tableId as string);
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                table: { include: { location: true } },
                user: { select: { id: true, name: true } },
                orderItems: {
                    include: {
                        menuItem: { select: { id: true, name: true, price: true, category: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const restaurantId = req.user?.restaurantId;
        const userId = req.user?.id;

        // Ensure ownership via findFirst
        const existingOrder = await prisma.order.findFirst({
            where: { id: parseInt(id), restaurantId }
        });

        if (!existingOrder) return res.status(404).json({ success: false, message: 'Pedido não encontrado' });

        let order;

        if (status === 'PAID' && existingOrder.status !== 'PAID') {
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Acesso negado' });
            }

            const openCash = await ensureCashSessionOpen(restaurantId!);
            order = await prisma.$transaction(async (tx) => {
                const paidOrder = await tx.order.update({
                    where: { id: parseInt(id) },
                    data: { status },
                    include: {
                        table: { include: { location: true } },
                        user: { select: { id: true, name: true } },
                        orderItems: { include: { menuItem: true } }
                    }
                });

                await tx.cashMovement.create({
                    data: {
                        restaurantId: restaurantId!,
                        cashSessionId: openCash.id,
                        userId,
                        type: 'ENTRY',
                        amount: Number(paidOrder.totalAmount || 0),
                        description: `Pagamento Pedido #${paidOrder.id}`
                    }
                });

                return paidOrder;
            });
        } else {
            order = await prisma.order.update({
                where: { id: parseInt(id) },
                data: { status },
                include: {
                    table: { include: { location: true } },
                    user: { select: { id: true, name: true } },
                    orderItems: { include: { menuItem: true } }
                }
            });
        }

        const io = (req as any).io;
        if (io) io.emit('orderUpdated', order);

        if (status === 'PAID') {
            await prisma.table.update({
                where: { id: order.tableId },
                data: { status: 'AVAILABLE' }
            });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};