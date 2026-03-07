import { Request, Response } from 'express';
import prisma from '../config/database';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { AuthRequest } from '../middleware/auth';
import { calculateCashSessionBalance, getOpenCashSession } from '../utils/cashSession';

export const getBillingStats = async (req: AuthRequest, res: Response) => {
    try {
        const { period } = req.query; // 'day', 'week', 'month', 'year'
        const restaurantId = req.user?.restaurantId;

        if (!restaurantId) return res.status(401).json({ success: false, message: 'Acesso negado' });

        // Tenant Filter Base
        const tenantFilter = { restaurantId };

        let startDate: Date;
        let endDate: Date;

        const now = new Date();

        switch (period) {
            case 'week':
                startDate = startOfWeek(now);
                endDate = endOfWeek(now);
                break;
            case 'month':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case 'year':
                startDate = startOfYear(now);
                endDate = endOfYear(now);
                break;
            default: // day
                startDate = startOfDay(now);
                endDate = endOfDay(now);
        }

        const orderTimeRange = {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        };

        const stockTimeRange = {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        };

        console.log(`Buscando estatísticas (SaaS Manual) para tenant ${restaurantId} - período: ${period}`);

        // 🛑 MODO MANUAL COM TENANT ISOLATION
        const allStatsOrders = await prisma.order.findMany({
            where: {
                ...tenantFilter,
                status: { not: 'CANCELLED' },
                ...orderTimeRange
            }
        });

        const REVENUE_STATUSES = ['PAID']; // SERVED ainda é pendente de pagamento

        let totalRevenue = 0;
        let paidCount = 0;
        let pendingRevenue = 0;
        let pendingCount = 0;

        allStatsOrders.forEach(o => {
            const val = Number(o.totalAmount || 0);
            if (REVENUE_STATUSES.includes(o.status)) {
                totalRevenue += val;
                paidCount++;
            } else {
                pendingRevenue += val;
                pendingCount++;
            }
        });

        // Vendas por categoria (Query DEBUG - SEM DATA - TENANT ISOLATED)
        const paidOrders = await prisma.order.findMany({
            where: {
                ...tenantFilter,
                OR: [
                    { status: 'PAID' },
                    { status: 'SERVED' }
                ],
                ...orderTimeRange
            },
            include: {
                orderItems: {
                    include: { menuItem: true }
                }
            }
        });

        const topDishMap: Record<string, { qty: number; revenue: number }> = {};
        paidOrders.forEach(order => {
            order.orderItems.forEach(item => {
                const itemType = item.menuItem.itemType || 'PRODUCT';
                if (itemType !== 'DISH') {
                    return;
                }
                const key = item.menuItem.name;
                if (!topDishMap[key]) {
                    topDishMap[key] = { qty: 0, revenue: 0 };
                }
                topDishMap[key].qty += item.quantity;
                topDishMap[key].revenue += item.quantity * item.price;
            });
        });

        let topConsumedDish: { name: string; quantity: number; revenue: number } | null = null;
        for (const [name, stats] of Object.entries(topDishMap)) {
            if (!topConsumedDish || stats.qty > topConsumedDish.quantity) {
                topConsumedDish = {
                    name,
                    quantity: stats.qty,
                    revenue: stats.revenue
                };
            }
        }

        const salesByCategory: { [key: string]: number } = {};
        const costByCategory: { [key: string]: number } = {};
        let totalCost = 0;

        paidOrders.forEach(order => {
            order.orderItems.forEach(item => {
                const cat = item.menuItem.category;
                const revenue = item.price * item.quantity;
                const cost = (item.menuItem.costPrice || 0) * item.quantity;

                salesByCategory[cat] = (salesByCategory[cat] || 0) + revenue;
                costByCategory[cat] = (costByCategory[cat] || 0) + cost;
                totalCost += cost;
            });
        });

        const grossProfit = totalRevenue - totalCost;
        // Margem de lucro baseada em receita PAGA
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        // Compras (Investimento stock)
        const purchasesWithSupplier = await prisma.stockMovement.findMany({
            where: {
                ...tenantFilter,
                type: 'ENTRY',
                ...stockTimeRange
            },
            include: { supplier: true }
        });

        const totalPurchases = purchasesWithSupplier.reduce((acc, m) => acc + (Math.abs(m.quantity) * (m.purchasePrice || 0)), 0);

        const purchasesBySupplier: { [key: string]: number } = {};
        purchasesWithSupplier.forEach(m => {
            const sName = m.supplier?.name || 'Sem Fornecedor';
            const value = Math.abs(m.quantity) * (m.purchasePrice || 0);
            purchasesBySupplier[sName] = (purchasesBySupplier[sName] || 0) + value;
        });

        const activeCashSession = await getOpenCashSession(restaurantId);
        let cashSummary = {
            isOpen: false,
            currentBalance: 0,
            openingBalance: 0,
            openedAt: null as Date | null
        };

        if (activeCashSession) {
            const currentBalance = await calculateCashSessionBalance(activeCashSession.id, activeCashSession.openingBalance);
            cashSummary = {
                isOpen: true,
                currentBalance,
                openingBalance: activeCashSession.openingBalance,
                openedAt: activeCashSession.openedAt
            };
        }

        res.json({
            success: true,
            data: {
                totalRevenue: Number(totalRevenue),
                totalCost: Number(totalCost),
                totalPurchases: Number(totalPurchases),
                grossProfit: Number(grossProfit),
                profitMargin,
                orderCount: paidOrders.length,
                pendingRevenue: Number(pendingRevenue),
                pendingCount: Number(pendingCount),
                period,
                salesByCategory,
                costByCategory,
                purchasesBySupplier,
                topConsumedDish,
                cashSummary
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : String(error)
        });
    }
};

export const getOrderHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { status, startDate, endDate } = req.query;
        const restaurantId = req.user?.restaurantId;

        if (!restaurantId) return res.status(401).json({ success: false, message: 'Acesso negado' });

        const where: any = { restaurantId };
        if (status) where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                table: { include: { location: true } },
                user: { select: { name: true } },
                orderItems: { include: { menuItem: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 500 // Limit history safety
        });

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Erro ao buscar histórico de pedidos:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};
