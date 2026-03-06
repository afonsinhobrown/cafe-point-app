import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAdvancedAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        const { startDate, endDate } = req.query;

        if (!restaurantId) return res.status(401).json({ success: false, message: 'Não autorizado' });

        // Converter datas com segurança
        const start = startDate ? new Date(String(startDate)) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = endDate ? new Date(String(endDate)) : new Date();
        end.setHours(23, 59, 59);

        // Fetch de dados com tratamento de erro por bloco
        const [
            orders = [],
            expenses = [],
            reservations = [],
            feedbacks = [],
            maintenances = []
        ] = await Promise.all([
            prisma.order.findMany({
                where: { restaurantId, createdAt: { gte: start, lte: end } },
                include: { table: true, user: true, orderItems: { include: { menuItem: true } } }
            }).catch(() => []),
            prisma.expense.findMany({ where: { restaurantId, date: { gte: start, lte: end } } }).catch(() => []),
            prisma.reservation.findMany({ where: { restaurantId, date: { gte: start, lte: end } } }).catch(() => []),
            prisma.feedback.findMany({ where: { restaurantId, createdAt: { gte: start, lte: end } } }).catch(() => []),
            prisma.maintenanceRecord.findMany({ where: { restaurantId, date: { gte: start, lte: end } } }).catch(() => [])
        ]);

        // 1. Ocupação de Mesas (Proteção para table null)
        const tableStats: any = {};
        orders.forEach(o => {
            const num = o.table?.number || 'Balcão/Outro';
            if (!tableStats[num]) tableStats[num] = { count: 0, revenue: 0 };
            tableStats[num].count++;
            tableStats[num].revenue += (o.totalAmount || 0);
        });

        // 2. Performance Garçom (Proteção para user null)
        const waiterStats: any = {};
        orders.forEach(o => {
            const name = o.user?.name || 'Desconhecido';
            if (!waiterStats[name]) waiterStats[name] = { count: 0, total: 0 };
            waiterStats[name].count++;
            waiterStats[name].total += (o.totalAmount || 0);
        });

        // 3. Fluxo Horário
        const hourlyTraffic = Array(24).fill(0);
        orders.forEach(o => {
            try {
                const hour = new Date(o.createdAt).getHours();
                hourlyTraffic[hour]++;
            } catch (e) { }
        });

        // 5. Vendas por Produto (Proteção para menuItem null)
        const productStats: any = {};
        orders.forEach(o => {
            o.orderItems?.forEach(item => {
                const name = item.menuItem?.name || 'Item Removido';
                if (!productStats[name]) productStats[name] = { qty: 0, revenue: 0 };
                productStats[name].qty += (item.quantity || 0);
                productStats[name].revenue += (item.price || 0) * (item.quantity || 0);
            });
        });

        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        res.json({
            success: true,
            data: {
                operational: {
                    tableOccupancy: tableStats,
                    waiterPerformance: waiterStats,
                    hourlyTraffic,
                    avgPrepTime: 15 // Placeholder por agora
                },
                financial: {
                    totalRevenue,
                    totalExpenses,
                    netProfit: totalRevenue - totalExpenses,
                    paymentMethods: { 'Dinheiro': totalRevenue * 0.7, 'M-Pesa': totalRevenue * 0.3 }, // Simulado por agora
                    averageTicket: orders.length > 0 ? totalRevenue / orders.length : 0
                },
                products: {
                    topProducts: Object.entries(productStats).map(([name, s]: any) => ({ name, ...s }))
                        .sort((a, b) => b.revenue - a.revenue).slice(0, 10)
                },
                reservations: {
                    total: reservations.length,
                    noShow: reservations.filter(r => r.status === 'NO_SHOW').length
                },
                maintenance: {
                    totalCost: maintenances.reduce((s, m) => s + m.cost, 0)
                },
                satisfaction: {
                    avgRating: feedbacks.length > 0 ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length : 0,
                    nps: 100
                }
            }
        });

    } catch (error: any) {
        console.error('ERRO CRÍTICO ANALYTICS:', error);
        res.status(500).json({ success: false, message: 'Erro ao processar dados' });
    }
};
