import { Request, Response } from 'express';
import prisma from '../config/database';
import { checkTrialLimit } from '../utils/trialLimits';

export const getLocations = async (req: Request, res: Response) => {
    try {
        const locations = await prisma.location.findMany({
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

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nome da localização é obrigatório'
            });
        }

        const existing = await prisma.location.findUnique({
            where: { name }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Já existe uma localização com este nome'
            });
        }

        const userId = (req as any).user?.id;
        if (userId) {
            await checkTrialLimit('location', userId);
        }

        const location = await prisma.location.create({
            data: { name, description }
        });

        res.status(201).json({
            success: true,
            data: location,
            message: 'Localização criada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao criar localização:', error);
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        const statusCode = message.includes('Trial') ? 403 : 500;

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

        // Verificar se existem mesas nesta localização
        const tablesCount = await prisma.table.count({
            where: { locationId: parseInt(id) }
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
