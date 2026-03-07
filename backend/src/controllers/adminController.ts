import { Request, Response } from 'express';
import prisma from '../config/database';

// ----------------------------------------------------------------------
// DASHBOARD & ANALYTICS
// ----------------------------------------------------------------------

export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const totalRestaurants = await prisma.restaurant.count();
        const activeLicenses = await prisma.license.count({ where: { status: 'ACTIVE' } });
        const totalUsers = await prisma.user.count();

        // Receita Real: Soma dos preços dos planos das licenças ativas
        const activeSubs = await prisma.license.findMany({
            where: { status: 'ACTIVE' },
            include: { plan: true }
        });
        const totalRevenue = activeSubs.reduce((acc, sub) => acc + (sub.plan.monthlyPrice || 0), 0);

        // Dispositivos Pendentes
        const pendingDevices = await prisma.device.count({ where: { status: 'PENDING_APPROVAL' } });

        res.json({
            success: true,
            data: {
                totalRestaurants,
                activeLicenses,
                totalUsers,
                totalRevenue,
                pendingDevices
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
    }
};

export const getAdminFinance = async (req: Request, res: Response) => {
    try {
        // Histórico Real de Licenças (Simulando transações com base nas datas de início)
        const licenses = await prisma.license.findMany({
            include: { restaurant: true, plan: true },
            orderBy: { startDate: 'desc' },
            take: 50
        });

        const transactions = licenses.map(lic => ({
            id: `LIC-${lic.id}`,
            restaurantName: lic.restaurant.name,
            planName: lic.plan.name,
            amount: lic.plan.monthlyPrice,
            date: lic.startDate,
            status: lic.status
        }));

        res.json({ success: true, data: { transactions } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro financeiro' });
    }
};

// ----------------------------------------------------------------------
// GESTÃO DE DISPOSITIVOS
// ----------------------------------------------------------------------

export const getAdminDevices = async (req: Request, res: Response) => {
    try {
        const devices = await prisma.device.findMany({
            include: { restaurant: true },
            orderBy: { lastActiveAt: 'desc' }
        });
        res.json({ success: true, data: devices });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar dispositivos' });
    }
};

export const approveDevice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.device.update({
            where: { id: parseInt(id) },
            data: { status: 'AUTHORIZED' }
        });
        res.json({ success: true, message: 'Dispositivo aprovado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao aprovar dispositivo' });
    }
};

export const blockDevice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.device.update({
            where: { id: parseInt(id) },
            data: { status: 'BLOCKED' }
        });
        res.json({ success: true, message: 'Dispositivo bloqueado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao bloquear dispositivo' });
    }
};

// ----------------------------------------------------------------------
// GESTÃO DE PLANOS
// ----------------------------------------------------------------------

export const getAdminPlans = async (req: Request, res: Response) => {
    try {
        const plans = await prisma.plan.findMany({
            include: { _count: { select: { licenses: true } } },
            orderBy: { monthlyPrice: 'asc' }
        });
        res.json({ success: true, data: plans });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar planos' });
    }
};

export const createPlan = async (req: Request, res: Response) => {
    try {
        const { name, maxUsers, maxTables, maxItems, monthlyPrice, duration } = req.body;
        const newPlan = await prisma.plan.create({
            data: {
                name,
                maxUsers: parseInt(maxUsers),
                maxTables: parseInt(maxTables),
                maxItems: parseInt(maxItems || 0),
                monthlyPrice: parseFloat(monthlyPrice),
                duration: parseInt(duration || 30) // Default 30 dias
            }
        });
        res.json({ success: true, data: newPlan, message: 'Plano criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao criar plano' });
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { maxUsers, maxTables, monthlyPrice, name, isActive, duration } = req.body;
        const planId = parseInt(id);

        // Verificar subscritores
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
            include: { _count: { select: { licenses: true } } }
        });

        if (!plan) return res.status(404).json({ message: 'Plano não encontrado' });

        const hasSubscribers = plan._count.licenses > 0;
        const dataToUpdate: any = {};

        // Regras de Edição
        if (isActive !== undefined) dataToUpdate.isActive = isActive;

        // Se tem subscritores e está tentando mudar campos sensíveis
        if (hasSubscribers) {
            if ((name && name !== plan.name) || (monthlyPrice && parseFloat(monthlyPrice) !== plan.monthlyPrice)) {
                return res.status(400).json({
                    success: false,
                    message: 'PROIBIDO: Não é possível alterar Nome ou Preço de um plano com assinantes ativos para preservar histórico. Desative este plano e crie um novo.'
                });
            }
        } else {
            // Sem subscritores, pode editar tudo
            if (name !== undefined) dataToUpdate.name = name;
            if (monthlyPrice !== undefined) dataToUpdate.monthlyPrice = parseFloat(monthlyPrice);
        }

        // Limites podem ser aumentados sempre (bom para o cliente), mas por segurança vamos aplicar a mesma regra, 
        // ou permitir? O usuário disse "plano nao deve ser editado". Vamos bloquear tudo sensível salvo 'isActive'.
        // Mas se o usuário quiser dar um "bonus" para todos? 
        // Vamos bloquear as estruturas.

        if (!hasSubscribers) {
            if (maxUsers !== undefined) dataToUpdate.maxUsers = parseInt(maxUsers);
            if (maxTables !== undefined) dataToUpdate.maxTables = parseInt(maxTables);
            if (duration !== undefined) dataToUpdate.duration = parseInt(duration);
        }

        const updated = await prisma.plan.update({
            where: { id: planId },
            data: dataToUpdate
        });

        res.json({ success: true, data: updated, message: hasSubscribers ? 'Plano atualizado (Apenas Status)' : 'Plano atualizado completamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar plano' });
    }
};

export const getRestaurantPlanHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const history = await prisma.planHistory.findMany({
            where: { restaurantId: parseInt(id) },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar histórico' });
    }
};

// ----------------------------------------------------------------------
// GESTÃO DE RESTAURANTES (TENANTS)
// ----------------------------------------------------------------------

export const getAllRestaurants = async (req: Request, res: Response) => {
    try {
        const restaurants = await prisma.restaurant.findMany({
            include: {
                license: { include: { plan: true } },
                _count: { select: { users: true, tables: true } } // Uso Real
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: restaurants });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar restaurantes' });
    }
};

export const approveRestaurant = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.restaurant.update({
            where: { id: parseInt(id) },
            data: { status: 'ACTIVE' }
        });
        res.json({ success: true, message: 'Restaurante ativado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao ativar' });
    }
};

export const suspendRestaurant = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.restaurant.update({
            where: { id: parseInt(id) },
            data: { status: 'SUSPENDED' }
        });
        res.json({ success: true, message: 'Restaurante suspenso' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao suspender' });
    }
};

export const getCashBoxes = async (req: Request, res: Response) => {
    try {
        const restaurantId = parseInt(req.params.restaurantId);
        const boxes = await prisma.cashBox.findMany({
            where: { restaurantId, isActive: true },
            orderBy: { createdAt: 'asc' }
        });
        res.json({ success: true, data: boxes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar caixas' });
    }
};

export const createCashBox = async (req: Request, res: Response) => {
    try {
        const restaurantId = parseInt(req.params.restaurantId);
        const { name, description, type } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Nome da caixa é obrigatório' });
        }

        const newBox = await prisma.cashBox.create({
            data: {
                restaurantId,
                name,
                description,
                type: type || 'DRAWER'
            }
        });
        res.json({ success: true, data: newBox, message: 'Caixa criada com sucesso' });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Já existe uma caixa com esse nome' });
        }
        res.status(500).json({ success: false, message: 'Erro ao criar caixa' });
    }
};

export const updateCashBox = async (req: Request, res: Response) => {
    try {
        const restaurantId = parseInt(req.params.restaurantId);
        const boxId = parseInt(req.params.boxId);
        const { name, description, type, isActive } = req.body;

        const updated = await prisma.cashBox.update({
            where: { id: boxId },
            data: { name, description, type, isActive }
        });
        res.json({ success: true, data: updated, message: 'Caixa atualizada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao atualizar caixa' });
    }
};

export const deleteCashBox = async (req: Request, res: Response) => {
    try {
        const restaurantId = parseInt(req.params.restaurantId);
        const boxId = parseInt(req.params.boxId);

        await prisma.cashBox.updateMany({
            where: { id: boxId, restaurantId },
            data: { isActive: false }
        });
        res.json({ success: true, message: 'Caixa desativada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao desativar caixa' });
    }
};

export const applyPlanToRestaurant = async (req: Request, res: Response) => {
    try {
        const restaurantId = parseInt(req.params.id);
        const { planId, startDate, endDate, durationDays } = req.body;

        if (!restaurantId || !planId) {
            return res.status(400).json({ success: false, message: 'Restaurante e plano são obrigatórios' });
        }

        const parsedPlanId = parseInt(String(planId));
        if (!parsedPlanId) {
            return res.status(400).json({ success: false, message: 'Plano inválido' });
        }

        const hasEndDate = typeof endDate === 'string' && endDate.trim() !== '';
        const hasDuration = durationDays !== undefined && durationDays !== null && String(durationDays).trim() !== '';

        if (hasEndDate && hasDuration) {
            return res.status(400).json({ success: false, message: 'Use apenas um modo: data fim OU número de dias' });
        }

        const effectiveStart = startDate ? new Date(startDate) : new Date();
        if (Number.isNaN(effectiveStart.getTime())) {
            return res.status(400).json({ success: false, message: 'Data de início inválida' });
        }

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: { license: { include: { plan: true } } }
        });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurante não encontrado' });
        }

        const selectedPlan = await prisma.plan.findUnique({ where: { id: parsedPlanId } });
        if (!selectedPlan) {
            return res.status(404).json({ success: false, message: 'Plano não encontrado' });
        }

        let effectiveEnd: Date | null = null;

        if (hasEndDate) {
            const parsedEnd = new Date(endDate);
            if (Number.isNaN(parsedEnd.getTime())) {
                return res.status(400).json({ success: false, message: 'Data de fim inválida' });
            }

            if (parsedEnd <= effectiveStart) {
                return res.status(400).json({ success: false, message: 'Data de fim deve ser maior que a data de início' });
            }

            effectiveEnd = parsedEnd;
        } else {
            const days = hasDuration ? parseInt(String(durationDays), 10) : selectedPlan.duration;

            if (!days || Number.isNaN(days) || days <= 0) {
                return res.status(400).json({ success: false, message: 'Número de dias inválido' });
            }

            effectiveEnd = new Date(effectiveStart);
            effectiveEnd.setDate(effectiveEnd.getDate() + days);
        }

        const updatedLicense = await prisma.$transaction(async (tx) => {
            const license = await tx.license.upsert({
                where: { restaurantId },
                update: {
                    planId: parsedPlanId,
                    startDate: effectiveStart,
                    endDate: effectiveEnd,
                    status: 'ACTIVE'
                },
                create: {
                    restaurantId,
                    planId: parsedPlanId,
                    startDate: effectiveStart,
                    endDate: effectiveEnd,
                    status: 'ACTIVE'
                },
                include: { plan: true }
            });

            await tx.planHistory.create({
                data: {
                    restaurantId,
                    oldPlanName: restaurant.license?.plan?.name || null,
                    newPlanName: selectedPlan.name,
                    price: selectedPlan.monthlyPrice,
                    startDate: effectiveStart,
                    endDate: effectiveEnd,
                    changedBy: (req as any).user?.username || 'SUPER_ADMIN'
                }
            });

            return license;
        });

        return res.json({
            success: true,
            message: 'Plano aplicado com sucesso',
            data: updatedLicense
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao aplicar plano no restaurante' });
    }
};
