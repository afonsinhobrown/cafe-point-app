import { Request, Response } from 'express';
import prisma from '../config/database';

export const getRestaurantSettings = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        let restaurantId = user.restaurantId;

        // Se for SUPER_ADMIN sem restaurante, mostramos o primeiro da lista para debug/gestão
        if (!restaurantId && user.role === 'SUPER_ADMIN') {
            const firstRest = await prisma.restaurant.findFirst();
            restaurantId = firstRest?.id;
        }

        if (!restaurantId) {
            return res.status(403).json({ success: false, message: 'Restaurante não identificado.' });
        }

        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId }
        });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurante não encontrado.' });
        }

        res.json({
            success: true,
            data: {
                name: restaurant.name,
                ownerName: restaurant.ownerName,
                email: restaurant.email,
                phone: restaurant.phone,
                address: restaurant.address,
                logo: restaurant.logo,
                nuit: (restaurant as any).nuit,
                ivaPercent: (restaurant as any).ivaPercent,
                receiptPreference: (restaurant as any).receiptPreference
            }
        });
    } catch (error) {
        console.error('Erro ao buscar definições:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

export const updateRestaurantSettings = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const restaurantId = user.restaurantId;

        if (!restaurantId) {
            return res.status(403).json({ success: false, message: 'Restaurante não identificado.' });
        }

        const { name, ownerName, email, phone, address, nuit, ivaPercent, receiptPreference } = req.body;

        // Se houver um ficheiro de imagem
        let logoPath = req.body.logo; // Manter o antigo se não enviar novo
        if (req.file) {
            logoPath = `/uploads/${req.file.filename}`;
        }

        const updated = await prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
                name,
                ownerName,
                email,
                phone,
                address,
                logo: logoPath,
                nuit,
                ivaPercent: parseFloat(ivaPercent),
                receiptPreference
            } as any
        });

        res.json({
            success: true,
            message: 'Definições atualizadas com sucesso!',
            data: updated
        });
    } catch (error) {
        console.error('Erro ao atualizar definições:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};
