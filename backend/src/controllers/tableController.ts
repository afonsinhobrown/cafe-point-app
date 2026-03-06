import { Request, Response } from 'express';
import prisma from '../config/database';
import { checkTrialLimit } from '../utils/trialLimits';

export const getTables = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const tenantFilter = user?.restaurantId ? { restaurantId: user.restaurantId } : {};

        const tables = await prisma.table.findMany({
            where: tenantFilter,
            include: {
                location: true,
                orders: {
                    where: {
                        status: {
                            in: ['PENDING', 'PREPARING', 'READY', 'SERVED']
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            },
            orderBy: {
                number: 'asc'
            }
        });

        // Enriquecer dados com status baseado no último pedido
        const tablesWithStatus = tables.map(table => {
            const lastOrder = table.orders[0];
            return {
                id: table.id,
                number: table.number,
                capacity: table.capacity,
                status: table.status,
                location: table.location?.name || 'Sem área',
                locationId: table.locationId,
                type: table.type,
                currentStatus: lastOrder ? lastOrder.status : 'AVAILABLE'
            };
        });

        res.json({
            success: true,
            data: tablesWithStatus
        });
    } catch (error) {
        console.error('Erro ao buscar mesas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const createTable = async (req: Request, res: Response) => {
    try {
        const { number, capacity, locationId, type } = req.body;
        const user = (req as any).user;
        const restaurantId = user.restaurantId;

        if (!restaurantId) return res.status(403).json({ success: false, message: 'Restaurante não identificado' });

        // Validar dados obrigatórios
        if (!number || !capacity || !type) {
            return res.status(400).json({
                success: false,
                message: 'Número, capacidade e tipo são obrigatórios'
            });
        }

        await checkTrialLimit('table', restaurantId);

        // Verificar se já existe mesa com este número NESTE RESTAURANTE
        const existingTable = await prisma.table.findFirst({
            where: { number: parseInt(number), restaurantId }
        });

        if (existingTable) {
            return res.status(400).json({
                success: false,
                message: 'Já existe uma mesa com este número'
            });
        }

        const table = await prisma.table.create({
            data: {
                restaurantId,
                number: parseInt(number),
                capacity: parseInt(capacity),
                locationId: locationId ? parseInt(locationId) : null,
                type,
                status: 'AVAILABLE'
            },
            include: { location: true }
        });

        // Emitir evento de nova mesa
        if ((req as any).io) {
            // TODO: Emitir apenas para salas do tenant: .to(`tenant-${restaurantId}`)
            (req as any).io.emit('tableCreated', table);
        }

        res.status(201).json({
            success: true,
            data: table,
            message: 'Mesa criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar mesa:', error);
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        const statusCode = message.includes('Limite') ? 403 : 500;

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

export const updateTable = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { number, capacity, locationId, type } = req.body;
        const user = (req as any).user;
        const restaurantId = user.restaurantId;

        // Verificar se a mesa existe e pertence ao tenant
        const existingTable = await prisma.table.findFirst({
            where: { id: parseInt(id), restaurantId }
        });

        if (!existingTable) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }

        // Se está mudando o número, verificar conflito no tenant
        if (number && number !== existingTable.number) {
            const tableWithNumber = await prisma.table.findFirst({
                where: { number: parseInt(number), restaurantId }
            });

            if (tableWithNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Já existe uma mesa com este número'
                });
            }
        }

        const table = await prisma.table.update({
            where: { id: parseInt(id) },
            data: {
                ...(number && { number: parseInt(number) }),
                ...(capacity && { capacity: parseInt(capacity) }),
                ...(locationId !== undefined && { locationId: locationId ? parseInt(locationId) : null }),
                ...(type && { type })
            },
            include: { location: true }
        });

        if ((req as any).io) (req as any).io.emit('tableUpdated', table);

        res.json({
            success: true,
            data: table,
            message: 'Mesa atualizada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const deleteTable = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;
        const restaurantId = user.restaurantId;

        // Verificar ownership e pedidos ativos
        const table = await prisma.table.findFirst({
            where: { id: parseInt(id), restaurantId },
            include: {
                orders: {
                    where: {
                        status: {
                            in: ['PENDING', 'PREPARING', 'READY', 'SERVED']
                        }
                    }
                }
            }
        });

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }

        if (table.orders.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível deletar mesa com pedidos ativos'
            });
        }

        await prisma.table.delete({
            where: { id: parseInt(id) }
        });

        if ((req as any).io) (req as any).io.emit('tableDeleted', { id: parseInt(id) });

        res.json({
            success: true,
            message: 'Mesa deletada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao deletar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const updateTableStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = (req as any).user;

        // Check ownership implicitly via update or Explicitly via findFirst. 
        // Prisma update throws if not found, but it's cleaner to check context if we wanted to be strict.
        // Assuming ID is sufficient if unique globally, but for security best practice, adding where clause if possible involves updateMany (not returns one) or checking first.
        // Since we have req.user, let's check ownership.

        const count = await prisma.table.count({ where: { id: parseInt(id), restaurantId: user.restaurantId } });
        if (count === 0) return res.status(404).json({ success: false, message: 'Mesa não encontrada' });

        const table = await prisma.table.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        if ((req as any).io) (req as any).io.emit('tableUpdated', table);

        res.json({
            success: true,
            data: table
        });
    } catch (error) {
        console.error('Erro ao atualizar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};