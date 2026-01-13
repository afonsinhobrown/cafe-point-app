import { Request, Response } from 'express';
import prisma from '../config/database';

export const getMenu = async (req: Request, res: Response) => {
    try {
        const { category, all } = req.query;

        const menuItems = await prisma.menuItem.findMany({
            where: {
                ...(all !== 'true' && { isAvailable: true }),
                ...(category && { category: category as any })
            },
            include: {
                brand: true,
                supplier: true
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
    } catch (error) {
        console.error('Erro ao buscar cardápio:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const createMenuItem = async (req: Request, res: Response) => {
    try {
        console.log('Criando item no menu. Body:', req.body);
        const {
            name, description, price, costPrice, category, brandId, supplierId, volume, unit, barcode, expiryDate,
            imageUrl, isAvailable, stockQuantity, minStock, maxStock
        } = req.body;
        const userId = (req as any).user.id;

        const menuItem = await prisma.menuItem.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                costPrice: costPrice ? parseFloat(costPrice) : 0,
                category,
                brandId: brandId ? parseInt(brandId) : null,
                supplierId: supplierId ? parseInt(supplierId) : null,
                volume,
                unit: unit || 'un',
                barcode,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                imageUrl,
                isAvailable: isAvailable ?? true,
                stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity) : 0,
                minStock: minStock !== undefined ? parseInt(minStock) : 5,
                maxStock: maxStock !== undefined ? parseInt(maxStock) : null
            }
        });

        // Se inicializou com stock, registar como ajuste inicial com preços históricos
        if (stockQuantity !== undefined && parseInt(stockQuantity) > 0) {
            await prisma.stockMovement.create({
                data: {
                    menuItemId: menuItem.id,
                    quantity: parseInt(stockQuantity),
                    type: 'ADJUSTMENT',
                    purchasePrice: costPrice ? parseFloat(costPrice) : 0,
                    sellingPrice: parseFloat(price),
                    reason: 'Stock inicial no cadastro',
                    userId: userId
                }
            });
        }

        res.status(201).json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Erro detalhado ao criar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor ao criar item'
        });
    }
};

export const updateMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name, description, price, costPrice, category, brandId, supplierId, volume, unit, barcode, expiryDate,
            imageUrl, isAvailable, stockQuantity, minStock, maxStock
        } = req.body;
        const userId = (req as any).user.id;

        // Buscar item atual para ver se o stock mudou
        const currentItem = await prisma.menuItem.findUnique({ where: { id: parseInt(id) } });

        const menuItem = await prisma.menuItem.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(price !== undefined && { price: parseFloat(price) }),
                ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) }),
                ...(category && { category }),
                ...(brandId !== undefined && { brandId: brandId ? parseInt(brandId) : null }),
                ...(supplierId !== undefined && { supplierId: supplierId ? parseInt(supplierId) : null }),
                ...(volume !== undefined && { volume }),
                ...(unit !== undefined && { unit }),
                ...(barcode !== undefined && { barcode }),
                ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(isAvailable !== undefined && { isAvailable }),
                ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity) }),
                ...(minStock !== undefined && { minStock: parseInt(minStock) }),
                ...(maxStock !== undefined && { maxStock: parseInt(maxStock) })
            }
        });

        // Registar movimento se o stock mudou manualmente com preços históricos
        if (stockQuantity !== undefined && currentItem && currentItem.stockQuantity !== parseInt(stockQuantity)) {
            const diff = parseInt(stockQuantity) - (currentItem.stockQuantity || 0);
            await prisma.stockMovement.create({
                data: {
                    menuItemId: menuItem.id,
                    quantity: diff,
                    type: diff > 0 ? 'ENTRY' : 'ADJUSTMENT',
                    purchasePrice: menuItem.costPrice,
                    sellingPrice: menuItem.price,
                    reason: 'Ajuste manual via gestão',
                    userId: userId
                }
            });
        }

        res.json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.menuItem.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Item removido com sucesso'
        });
    } catch (error) {
        console.error('Erro ao remover item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};