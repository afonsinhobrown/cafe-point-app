import { Request, Response } from 'express';
import prisma from '../config/database';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

export const getBillingStats = async (req: Request, res: Response) => {
    try {
        const { period } = req.query; // 'day', 'week', 'month', 'year'
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

        const timeRange = {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        };

        console.log(`Buscando (Modo Manual) para período: ${period}`);

        // 🛑 MODO MANUAL: Busca tudo e soma no JS
        const allStatsOrders = await prisma.order.findMany({
            where: {
                status: { not: 'CANCELLED' }
                // Sem filtro de data temporariamente
            }
        });

        const REVENUE_STATUSES = ['PAID']; // SERVED (Entregue) ainda é pendente de pagamento

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
                // Se não está PAGO, mas também não CANCELADO, é Pendente (Inclui SERVED, READY, ETC)
                pendingRevenue += val;
                pendingCount++;
            }
        });

        console.log('Resumo Calculado (Manual):', { totalRevenue, pendingRevenue });

        // Vendas por categoria (Query DEBUG - SEM DATA)
        const paidOrders = await prisma.order.findMany({
            where: {
                // Incluimos SERVED aqui para o gráfico de categorias mostrar o que saiu
                OR: [
                    { status: 'PAID' },
                    { status: 'SERVED' }
                ],
                // ...timeRange // 🛑 FILTRO DE DATA DESATIVADO PARA DEBUG
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });

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

                // Custo só conta se o pedido foi servido/pago (produto saiu do estoque)
                totalCost += cost;
            });
        });

        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        // 🛑 DEBUG: REATIVANDO Compras mas SEM DATA
        // Calcular total de compras (investimento em stock)
        const purchasesWithSupplier = await prisma.stockMovement.findMany({
            where: {
                // ...timeRange, // Sem data tb em compras
                type: 'ENTRY'
            },
            include: { supplier: true }
        });

        const totalPurchases = purchasesWithSupplier.reduce((acc, m) => acc + (Math.abs(m.quantity) * (m.purchasePrice || 0)), 0);

        // Calcular compras por fornecedor para balanço profissional
        const purchasesBySupplier: { [key: string]: number } = {};
        purchasesWithSupplier.forEach(m => {
            const sName = m.supplier?.name || 'Sem Fornecedor';
            const value = Math.abs(m.quantity) * (m.purchasePrice || 0);
            purchasesBySupplier[sName] = (purchasesBySupplier[sName] || 0) + value;
        });

        // Mock values para evitar erro no frontend (REMOVIDO MOCK)
        // const totalPurchases = 0;
        // const purchasesBySupplier = {};

        res.json({
            success: true,
            data: {
                totalRevenue: Number(totalRevenue),
                totalCost: Number(totalCost),
                totalPurchases: Number(totalPurchases),
                grossProfit: Number(grossProfit),
                profitMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
                orderCount: paidOrders.length,
                pendingRevenue: Number(pendingRevenue),
                pendingCount: Number(pendingCount),
                period,
                salesByCategory,
                costByCategory,
                purchasesBySupplier
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

export const getOrderHistory = async (req: Request, res: Response) => {
    try {
        const { status, startDate, endDate } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                table: {
                    include: { location: true }
                },
                user: { select: { name: true } },
                orderItems: {
                    include: { menuItem: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Erro ao buscar histórico de pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
