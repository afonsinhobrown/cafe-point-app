import { Request, Response } from 'express';
import prisma from '../config/database';

// BRANDS
export const getBrands = async (req: Request, res: Response) => {
    try {
        const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
        res.json({ success: true, data: brands });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar marcas' });
    }
};

export const createBrand = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const brand = await prisma.brand.create({ data: { name } });
        res.status(201).json({ success: true, data: brand });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao criar marca' });
    }
};

export const deleteBrand = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.brand.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Marca removida' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao remover marca (pode estar associada a produtos)' });
    }
};

// SUPPLIERS
export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar fornecedores' });
    }
};

export const createSupplier = async (req: Request, res: Response) => {
    try {
        const { name, nuit, email, phone, address, description } = req.body;
        const supplier = await prisma.supplier.create({
            data: {
                name,
                nuit,
                email,
                phone,
                address,
                description
            }
        });
        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        console.error('Erro ao criar fornecedor:', error);
        res.status(500).json({ success: false, message: 'Erro ao criar fornecedor' });
    }
};

export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.supplier.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Fornecedor removido' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao remover fornecedor (pode estar associado a compras)' });
    }
};
