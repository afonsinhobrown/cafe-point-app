import { Request, Response } from 'express';
import prisma from '../config/database';
import { checkTrialLimit } from '../utils/trialLimits';
import { AuthRequest } from '../middleware/auth';

export const getMenu = async (req: Request, res: Response) => {
    try {
        const { category, all } = req.query;
        // Se for request autenticada, usa o tenant do usuário. 
        // Se for pública, deveria vir o restaurantSlug ou ID na query/header.
        // Assumindo autenticado para gestão OU passando ID na query para público.

        // TODO: Para Menu Público (QR Code), precisamos de uma lógica pública.
        // Por enquanto, focamos no painel de gestão (Autenticado).

        const user = (req as any).user;

        console.log(`[MENU DEBUG] User: ${user?.username} | RestID: ${user?.restaurantId}`);

        if (!user || !user.restaurantId) {
            console.error('[MENU SECURITY WARNING] Request without restaurantId attempted to list menu.');
            // Se não tiver restaurantId, DEVE ser bloqueado em rotas autenticadas de gestão.
            return res.status(403).json({ success: false, message: 'Acesso negado: Restaurante não identificado.' });
        }

        const tenantFilter = { restaurantId: user.restaurantId };

        const menuItems = await prisma.menuItem.findMany({
            where: {
                ...tenantFilter,
                ...(all !== 'true' && { isAvailable: true }),
                ...(category && { category: category as any })
            },
            include: {
                brand: true,
                supplier: true,
                recipeIngredients: {
                    include: { ingredient: true }
                }
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
        const {
            name, description, price, costPrice, category, brandId, supplierId, volume, unit, barcode, expiryDate,
            imageUrl, isAvailable, stockQuantity, minStock, maxStock,
            itemType, recipeIngredients // New fields
        } = req.body;

        const user = (req as any).user;
        const restaurantId = user.restaurantId;

        if (!restaurantId) {
            return res.status(403).json({ success: false, message: 'Restaurante não identificado.' });
        }

        // Verificar limite do plano
        await checkTrialLimit('menuItem', restaurantId);

        const menuItem = await prisma.menuItem.create({
            data: {
                restaurantId, // Vinculo multi-tenant obrigatório
                name,
                description,
                price: isNaN(parseFloat(price)) ? 0 : parseFloat(price),
                costPrice: (costPrice && !isNaN(parseFloat(costPrice))) ? parseFloat(costPrice) : 0,
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
                maxStock: maxStock !== undefined ? parseInt(maxStock) : null,
                itemType: itemType || 'PRODUCT'
            }
        });

        // Handle Recipe Ingredients if DISH
        if (itemType === 'DISH' && Array.isArray(recipeIngredients) && recipeIngredients.length > 0) {
            await prisma.recipeItem.createMany({
                data: recipeIngredients.map((ri: any) => ({
                    parentItemId: menuItem.id,
                    ingredientId: parseInt(ri.ingredientId),
                    quantity: parseFloat(ri.quantity),
                    unit: ri.unit
                }))
            });
        }

        // Stock Inicial
        if (stockQuantity !== undefined && parseInt(stockQuantity) > 0) {
            await prisma.stockMovement.create({
                data: {
                    restaurantId,
                    menuItemId: menuItem.id,
                    quantity: parseInt(stockQuantity),
                    type: 'ADJUSTMENT',
                    purchasePrice: costPrice ? parseFloat(costPrice) : 0,
                    sellingPrice: parseFloat(price),
                    reason: 'Stock inicial no cadastro',
                    userId: user.id
                }
            });
        }

        res.status(201).json({ success: true, data: menuItem });

    } catch (error) {
        console.error('Erro detalhado ao criar item:', error);
        const message = error instanceof Error ? error.message : 'Erro interno';
        const statusCode = message.includes('Limite') ? 403 : 500;

        res.status(statusCode).json({ success: false, message });
    }
};

export const updateMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name, description, price, costPrice, category, brandId, supplierId, volume, unit, barcode, expiryDate,
            imageUrl, isAvailable, stockQuantity, minStock, maxStock,
            itemType, recipeIngredients // New fields
        } = req.body;

        const user = (req as any).user;
        const restaurantId = user.restaurantId;

        // Validar se o item pertence ao restaurante!
        const currentItem = await prisma.menuItem.findFirst({
            where: { id: parseInt(id), restaurantId }
        });

        if (!currentItem) {
            return res.status(404).json({ success: false, message: 'Item não encontrado.' });
        }

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
                ...(maxStock !== undefined && { maxStock: parseInt(maxStock) }),
                ...(itemType && { itemType })
            }
        });

        // Update Recipe Ingredients
        if (itemType === 'DISH' && recipeIngredients) {
            // Delete old ingredients
            await prisma.recipeItem.deleteMany({
                where: { parentItemId: parseInt(id) }
            });

            // Create new ones
            if (Array.isArray(recipeIngredients) && recipeIngredients.length > 0) {
                await prisma.recipeItem.createMany({
                    data: recipeIngredients.map((ri: any) => ({
                        parentItemId: parseInt(id),
                        ingredientId: parseInt(ri.ingredientId),
                        quantity: parseFloat(ri.quantity),
                        unit: ri.unit
                    }))
                });
            }
        }

        if (stockQuantity !== undefined && currentItem.stockQuantity !== parseInt(stockQuantity)) {
            const diff = parseInt(stockQuantity) - (currentItem.stockQuantity || 0);
            await prisma.stockMovement.create({
                data: {
                    restaurantId,
                    menuItemId: menuItem.id,
                    quantity: diff,
                    type: diff > 0 ? 'ENTRY' : 'ADJUSTMENT',
                    purchasePrice: menuItem.costPrice,
                    sellingPrice: menuItem.price,
                    reason: 'Ajuste manual via gestão',
                    userId: user.id
                }
            });
        }

        res.json({ success: true, data: menuItem });

    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        // Ensure ownership
        const count = await prisma.menuItem.count({
            where: { id: parseInt(id), restaurantId: user.restaurantId }
        });

        if (count === 0) {
            return res.status(404).json({ success: false, message: 'Item não encontrado.' });
        }

        await prisma.menuItem.delete({
            where: { id: parseInt(id) }
        });

        res.json({ success: true, message: 'Item removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover item:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};