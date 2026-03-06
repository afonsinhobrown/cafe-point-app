import { Request, Response } from 'express';
import prisma from '../config/database';
import { checkTrialLimit } from '../utils/trialLimits';
import { AuthRequest } from '../middleware/auth';

export const getLocations = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const tenantFilter = user?.restaurantId ? { restaurantId: user.restaurantId } : {};

        const locations = await prisma.location.findMany({
            where: tenantFilter,
            orderBy: { name: 'asc' }
        });
        res.json({
            success: true,
            data: locations
        });
    } catch (error) {
        console.error('Erro ao buscar localizações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const createLocation = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const user = (req as any).user;
        const restaurantId = user.restaurantId;

        if (!restaurantId) return res.status(403).json({ success: false, message: 'Restaurante não identificado' });

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nome da localização é obrigatório'
            });
        }

        const existing = await prisma.location.findFirst({
            where: { name, restaurantId } // Check duplicidade Por Tenant
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Já existe uma localização com este nome'
            });
        }

        // Verificar limite trial
        await checkTrialLimit('location', restaurantId);

        const location = await prisma.location.create({
            data: {
                name,
                description,
                restaurantId
            }
        });

        res.status(201).json({
            success: true,
            data: location,
            message: 'Localização criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar localização:', error);
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        const statusCode = message.includes('Limite') ? 403 : 500;

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

export const updateLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const user = (req as any).user;

        // Ensure ownership
        const existing = await prisma.location.findFirst({
            where: { id: parseInt(id), restaurantId: user.restaurantId }
        });

        if (!existing) return res.status(404).json({ success: false, message: 'Localização não encontrada' });

        const location = await prisma.location.update({
            where: { id: parseInt(id) },
            data: { name, description }
        });

        res.json({
            success: true,
            data: location,
            message: 'Localização atualizada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar localização:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const deleteLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        // Ensure ownership
        const existing = await prisma.location.findFirst({
            where: { id: parseInt(id), restaurantId: user.restaurantId }
        });

        if (!existing) return res.status(404).json({ success: false, message: 'Localização não encontrada' });

        // Verificar se existem mesas nesta localização
        const tablesCount = await prisma.table.count({
            where: { locationId: parseInt(id) } // Mesas do mesmo tenant, assumido pelo FK constraint
        });

        if (tablesCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível deletar uma localização que possui mesas'
            });
        }

        await prisma.location.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Localização deletada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao deletar localização:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
