"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderHistory = exports.getBillingStats = void 0;
const database_1 = __importDefault(require("../config/database"));
const date_fns_1 = require("date-fns");
const getBillingStats = async (req, res) => {
    try {
        const { period } = req.query; // 'day', 'week', 'month', 'year'
        let startDate;
        let endDate;
        const now = new Date();
        switch (period) {
            case 'week':
                startDate = (0, date_fns_1.startOfWeek)(now);
                endDate = (0, date_fns_1.endOfWeek)(now);
                break;
            case 'month':
                startDate = (0, date_fns_1.startOfMonth)(now);
                endDate = (0, date_fns_1.endOfMonth)(now);
                break;
            case 'year':
                startDate = (0, date_fns_1.startOfYear)(now);
                endDate = (0, date_fns_1.endOfYear)(now);
                break;
            default: // day
                startDate = (0, date_fns_1.startOfDay)(now);
                endDate = (0, date_fns_1.endOfDay)(now);
        }
        const stats = await database_1.default.order.aggregate({
            _sum: {
                totalAmount: true
            },
            _count: {
                id: true
            },
            where: {
                status: 'PAID',
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        // Vendas por categoria
        const ordersInPeriod = await database_1.default.order.findMany({
            where: {
                status: 'PAID',
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });
        const salesByCategory = {};
        ordersInPeriod.forEach(order => {
            order.orderItems.forEach(item => {
                const cat = item.menuItem.category;
                salesByCategory[cat] = (salesByCategory[cat] || 0) + (item.price * item.quantity);
            });
        });
        res.json({
            success: true,
            data: {
                totalRevenue: stats._sum.totalAmount || 0,
                orderCount: stats._count.id,
                period,
                salesByCategory
            }
        });
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.getBillingStats = getBillingStats;
const getOrderHistory = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const orders = await database_1.default.order.findMany({
            where,
            include: {
                table: true,
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
    }
    catch (error) {
        console.error('Erro ao buscar histórico de pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.getOrderHistory = getOrderHistory;
