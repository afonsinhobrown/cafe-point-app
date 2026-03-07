import { Request, Response } from 'express';
import prisma from '../config/database';

export const getPlans = async (req: Request, res: Response) => {
    try {
        const plans = await prisma.plan.findMany({
            where: { isActive: true }, // Apenas planos ativos para novas assinaturas
            orderBy: { monthlyPrice: 'asc' }
        });
        res.json({ success: true, data: plans });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar planos' });
    }
};

export const getMySubscription = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const restaurantId = user.restaurantId;

        const license = await prisma.license.findUnique({
            where: { restaurantId },
            include: { plan: true }
        });

        if (!license) {
            return res.status(404).json({ success: false, message: 'Licença não encontrada' });
        }

        // Calcular uso real
        const usersCount = await prisma.user.count({ where: { restaurantId } });
        const tablesCount = await prisma.table.count({ where: { restaurantId } });

        res.json({
            success: true,
            data: {
                license,
                plan: license.plan,
                usage: {
                    users: usersCount,
                    tables: tablesCount
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar assinatura' });
    }
};

export const requestUpgrade = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { planId } = req.body;
        const restaurantId = user.restaurantId;

        // Validar plano
        const newPlan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!newPlan) return res.status(404).json({ success: false, message: 'Plano não encontrado' });

        // Get Current License (for history)
        const currentLicense = await prisma.license.findUnique({ where: { restaurantId }, include: { plan: true } });

        // Calcular datas para o novo plano
        const planStartDate = new Date();
        const planEndDate = new Date(planStartDate);
        planEndDate.setDate(planEndDate.getDate() + (newPlan.duration || 30));

        // Atualizar Licença (Simulação de Pagamento)
        const updatedLicense = await prisma.license.update({
            where: { restaurantId },
            data: {
                planId: planId,
                status: 'ACTIVE',
                startDate: planStartDate,
                endDate: planEndDate
            },
            include: { plan: true }
        });

        await prisma.planHistory.create({
            data: {
                restaurantId,
                oldPlanName: currentLicense?.plan?.name || 'Incial',
                newPlanName: newPlan.name,
                price: newPlan.monthlyPrice,
                startDate: planStartDate,
                endDate: planEndDate,
                changedBy: user.username
            }
        });

        res.json({
            success: true,
            message: `Plano atualizado para ${newPlan.name} com sucesso!`,
            data: updatedLicense
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro ao processar upgrade' });
    }
};
