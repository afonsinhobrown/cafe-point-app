"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMenuItem = exports.updateMenuItem = exports.createMenuItem = exports.getMenu = void 0;
const database_1 = __importDefault(require("../config/database"));
const getMenu = async (req, res) => {
    try {
        const { category, all } = req.query;
        const menuItems = await database_1.default.menuItem.findMany({
            where: {
                ...(all !== 'true' && { isAvailable: true }),
                ...(category && { category: category })
            },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });
        res.json({
            success: true,
            data: menuItems
        });
    }
    catch (error) {
        console.error('Erro ao buscar cardápio:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.getMenu = getMenu;
const createMenuItem = async (req, res) => {
    try {
        console.log('Criando item no menu. Body:', req.body);
        const { name, description, price, category, imageUrl, isAvailable } = req.body;
        const menuItem = await database_1.default.menuItem.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                category,
                imageUrl,
                isAvailable: isAvailable ?? true
            }
        });
        res.status(201).json({
            success: true,
            data: menuItem
        });
    }
    catch (error) {
        console.error('Erro ao criar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.createMenuItem = createMenuItem;
const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, imageUrl, isAvailable } = req.body;
        const menuItem = await database_1.default.menuItem.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(price !== undefined && { price: parseFloat(price) }),
                ...(category && { category }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(isAvailable !== undefined && { isAvailable })
            }
        });
        res.json({
            success: true,
            data: menuItem
        });
    }
    catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.updateMenuItem = updateMenuItem;
const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        await database_1.default.menuItem.delete({
            where: { id: parseInt(id) }
        });
        res.json({
            success: true,
            message: 'Item removido com sucesso'
        });
    }
    catch (error) {
        console.error('Erro ao remover item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.deleteMenuItem = deleteMenuItem;
