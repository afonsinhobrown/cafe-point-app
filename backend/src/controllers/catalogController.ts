import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// BRANDS
export const getBrands = async (req: AuthRequest, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        if (!restaurantId) return res.status(401).json({ success: false, message: 'Acesso negado' });

        const brands = await prisma.brand.findMany({
            where: { restaurantId },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: brands });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar marcas' });
    }
};

export const createBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const restaurantId = req.user?.restaurantId;

        if (!restaurantId) return res.status(401).json({ success: false, message: 'Acesso negado' });

        const brand = await prisma.brand.create({
            data: {
                name,
                restaurantId
            }
        });
        res.status(201).json({ success: true, data: brand });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao criar marca' });
    }
};

export const deleteBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user?.restaurantId;

        // Ensure ownership
        const existing = await prisma.brand.findFirst({
            where: { id: parseInt(id), restaurantId }
        });

        if (!existing) return res.status(404).json({ success: false, message: 'Marca não encontrada' });

        await prisma.brand.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Marca removida' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao remover marca (pode estar associada a produtos)' });
    }
};

// SUPPLIERS
export const getSuppliers = async (req: AuthRequest, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        if (!restaurantId) return res.status(401).json({ success: false, message: 'Acesso negado' });

        const suppliers = await prisma.supplier.findMany({
            where: { restaurantId },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar fornecedores' });
    }
};

export const createSupplier = async (req: AuthRequest, res: Response) => {
    try {
        const { name, nuit, email, phone, address, description } = req.body;
        const restaurantId = req.user?.restaurantId;

        if (!restaurantId) return res.status(401).json({ success: false, message: 'Acesso negado' });

        const supplier = await prisma.supplier.create({
            data: {
                name,
                nuit,
                email,
                phone,
                address,
                description,
                restaurantId
            }
        });
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        console.error('Erro ao criar fornecedor:', error);
        res.status(500).json({ success: false, message: 'Erro ao criar fornecedor' });
    }
};

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user?.restaurantId;

        // Ensure ownership
        const existing = await prisma.supplier.findFirst({
            where: { id: parseInt(id), restaurantId }
        });

        if (!existing) return res.status(404).json({ success: false, message: 'Fornecedor não encontrado' });

        await prisma.supplier.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Fornecedor removido' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao remover fornecedor (pode estar associado a compras)' });
    }
};
