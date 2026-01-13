"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getOrders = exports.createOrder = void 0;
const database_1 = __importDefault(require("../config/database"));
const createOrder = async (req, res) => {
    try {
        const { tableId, items } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Utilizador não autenticado'
            });
        }
        // Verificar se a mesa existe
        const table = await database_1.default.table.findUnique({
            where: { id: tableId }
        });
        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Mesa não encontrada'
            });
        }
        // Buscar preços dos itens do menu
        const menuItems = await database_1.default.menuItem.findMany({
            where: {
                id: { in: items.map((item) => item.menuItemId) },
                isAvailable: true
            }
        });
        // Verificar se todos os itens existem
        const invalidItems = items.filter((item) => !menuItems.find(mi => mi.id === item.menuItemId));
        if (invalidItems.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Alguns itens do menu não foram encontrados'
            });
        }
        // Calcular total
        const totalAmount = items.reduce((total, item) => {
            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
            return total + (menuItem?.price || 0) * item.quantity;
        }, 0);
        // Criar pedido na base de dados
        const order = await database_1.default.order.create({
            data: {
                tableId,
                userId,
                totalAmount,
                orderItems: {
                    create: items.map((item) => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        notes: item.notes,
                        price: menuItems.find(mi => mi.id === item.menuItemId)?.price || 0
                    }))
                }
            },
            include: {
                table: {
                    select: {
                        id: true,
                        number: true,
                        capacity: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                orderItems: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                category: true
                            }
                        }
                    }
                }
            }
        });
        // Emitir evento Socket.io para a cozinha
        const io = req.io;
        if (io) {
            io.emit('newOrder', order);
        }
        // Atualizar status da mesa para ocupada
        await database_1.default.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED' }
        });
        res.status(201).json({
            success: true,
            data: order
        });
    }
    catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.createOrder = createOrder;
const getOrders = async (req, res) => {
    try {
        const { status, tableId } = req.query;
        const whereClause = {};
        if (status) {
            if (typeof status === 'string') {
                whereClause.status = { in: status.split(',') };
            }
        }
        if (tableId) {
            whereClause.tableId = parseInt(tableId);
        }
        const orders = await database_1.default.order.findMany({
            where: whereClause,
            include: {
                table: {
                    select: {
                        id: true,
                        number: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                orderItems: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                category: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: orders
        });
    }
    catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.getOrders = getOrders;
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = await database_1.default.order.update({
            where: { id: parseInt(id) },
            data: { status },
            include: {
                table: {
                    select: {
                        id: true,
                        number: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                orderItems: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });
        // Emitir evento de atualização
        const io = req.io;
        if (io) {
            io.emit('orderUpdated', order);
        }
        // Se o pedido foi pago, liberar a mesa
        if (status === 'PAID') {
            await database_1.default.table.update({
                where: { id: order.tableId },
                data: { status: 'AVAILABLE' }
            });
        }
        res.json({
            success: true,
            data: order
        });
    }
    catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.updateOrderStatus = updateOrderStatus;
