import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { tableId, items } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Utilizador não autenticado'
            });
        }

        // Verificar se a mesa existe
        const table = await prisma.table.findUnique({
            where: { id: tableId }
        });

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }

        // Buscar preços dos itens do menu
        const menuItems = await prisma.menuItem.findMany({
            where: {
                id: { in: items.map((item: any) => item.menuItemId) },
                isAvailable: true
            }
        });

        // Verificar se todos os itens existem
        const invalidItems = items.filter((item: any) =>
            !menuItems.find(mi => mi.id === item.menuItemId)
        );

        if (invalidItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Alguns itens do menu não foram encontrados'
            });
        }

        // Verificar se todos os itens existem e têm estoque (Apenas para Bebidas)
        for (const item of items) {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
            if (!menuItem) continue;

            if (menuItem.category === 'Bebidas' && menuItem.stockQuantity !== null && menuItem.stockQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Estoque insuficiente para a bebida: ${menuItem.name}`
                });
            }
        }

        // Calcular total
        const totalAmount = items.reduce((total: number, item: any) => {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
            return total + (menuItem?.price || 0) * item.quantity;
        }, 0);

        // Criar pedido e atualizar estoque em uma transação
        const order = await prisma.$transaction(async (tx) => {
            // Criar o pedido
            const newOrder = await tx.order.create({
                data: {
                    tableId,
                    userId,
                    totalAmount,
                    orderItems: {
                        create: items.map((item: any) => ({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            notes: item.notes,
                            price: menuItems.find(mi => mi.id === item.menuItemId)?.price || 0
                        }))
                    }
                },
                include: {
                    table: { include: { location: true } },
                    user: { select: { id: true, name: true, username: true } },
                    orderItems: {
                        include: {
                            menuItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                    category: true
                                }
                            }
                        }
                    }
                }
            });

            // Dar baixa no estoque (Apenas para Bebidas)
            for (const item of items) {
                const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                if (menuItem && menuItem.category === 'Bebidas' && menuItem.stockQuantity !== null) {
                    await tx.menuItem.update({
                        where: { id: menuItem.id },
                        data: { stockQuantity: { decrement: item.quantity } }
                    });

                    // Registar o movimento sistemático para auditoria
                    await tx.stockMovement.create({
                        data: {
                            menuItemId: menuItem.id,
                            quantity: -item.quantity,
                            type: 'EXIT_SALE',
                            reason: `Venda Pedido #${newOrder.id}`,
                            userId: userId
                        }
                    });
                }
            }

            return newOrder;
        });

        // Emitir evento Socket.io para a cozinha
        const io = (req as any).io;
        if (io) {
            io.emit('newOrder', order);
        }

        // Atualizar status da mesa para ocupada
        await prisma.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED' }
        });

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const { status, tableId } = req.query;

        const whereClause: any = {};
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
                table: {
                    include: { location: true }
                },
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                orderItems: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                category: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await prisma.order.update({
            where: { id: parseInt(id) },
            data: { status },
            include: {
                table: {
                    include: { location: true }
                },
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                orderItems: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });

        // Emitir evento de atualização
        const io = (req as any).io;
        if (io) {
            io.emit('orderUpdated', order);
        }

        // Se o pedido foi pago, liberar a mesa
        if (status === 'PAID') {
            await prisma.table.update({
                where: { id: order.tableId },
                data: { status: 'AVAILABLE' }
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};