import { Request, Response } from 'express';
import prisma from '../config/database';

export const getTables = async (req: Request, res: Response) => {
    try {
        const tables = await prisma.table.findMany({
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

        // Validar dados obrigatórios
        if (!number || !capacity || !type) {
            return res.status(400).json({
                success: false,
                message: 'Número, capacidade e tipo são obrigatórios'
            });
        }

        // Verificar se já existe mesa com este número
        const existingTable = await prisma.table.findUnique({
            where: { number: parseInt(number) }
        });

        if (existingTable) {
            return res.status(400).json({
                success: false,
                message: 'Já existe uma mesa com este número'
            });
        }

        const table = await prisma.table.create({
            data: {
                number: parseInt(number),
                capacity: parseInt(capacity),
                locationId: locationId ? parseInt(locationId) : null,
                type,
                status: 'AVAILABLE'
            },
            include: { location: true }
        });

        // Emitir evento de nova mesa
        (req as any).io?.emit('tableCreated', table);

        res.status(201).json({
            success: true,
            data: table,
            message: 'Mesa criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const updateTable = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { number, capacity, locationId, type } = req.body;

        // Verificar se a mesa existe
        const existingTable = await prisma.table.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingTable) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }

        // Se está mudando o número, verificar se não existe outra mesa com esse número
        if (number && number !== existingTable.number) {
            const tableWithNumber = await prisma.table.findUnique({
                where: { number: parseInt(number) }
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

        // Emitir evento de atualização de mesa
        (req as any).io?.emit('tableUpdated', table);

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

        // Verificar se a mesa existe
        const table = await prisma.table.findUnique({
            where: { id: parseInt(id) },
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

        // Não permitir deletar mesa com pedidos ativos
        if (table.orders.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível deletar mesa com pedidos ativos'
            });
        }

        await prisma.table.delete({
            where: { id: parseInt(id) }
        });

        // Emitir evento de exclusão de mesa
        (req as any).io?.emit('tableDeleted', { id: parseInt(id) });

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

        const table = await prisma.table.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        // Emitir evento de atualização de mesa
        (req as any).io?.emit('tableUpdated', table);

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