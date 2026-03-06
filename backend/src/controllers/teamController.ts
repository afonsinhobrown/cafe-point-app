import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Listar membros da equipe
export const getTeamMembers = async (req: Request | any, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        if (!restaurantId) return res.status(403).json({ message: 'Restaurante não identificado' });

        const members = await prisma.user.findMany({
            where: { restaurantId },
            select: { id: true, name: true, username: true, role: true, createdAt: true }
        });

        const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { slug: true } });

        res.json({ success: true, data: members, restaurantSlug: restaurant?.slug });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar equipe' });
    }
};

// Adicionar membro
export const addTeamMember = async (req: Request | any, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        if (!restaurantId) return res.status(403).json({ message: 'Restaurante não identificado' });

        const { name, username, password, role } = req.body;

        // Validar Role permitida para criação por um Admin de Restaurante
        if (!['WAITER', 'KITCHEN', 'ADMIN'].includes(role)) {
            return res.status(400).json({ message: 'Role inválida' });
        }

        // Verificar limite de usuários do plano (opcional, mas bom ter)
        // Por enquanto, vamos pular a verificação estrita do plano para não bloquear o usuario agora,
        // mas seria: const license = await prisma.license... check maxUsers.

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                username,
                password: hashedPassword,
                role: role,
                restaurantId
            }
        });

        res.json({ success: true, message: 'Membro adicionado', data: { id: newUser.id, name: newUser.name } });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Este nome de usuário já existe neste restaurante.' });
        }
        res.status(500).json({ success: false, message: 'Erro ao criar usuário ' + error.message });
    }
};

// Remover membro
export const removeTeamMember = async (req: Request | any, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        const { id } = req.params;
        const memberId = parseInt(id);

        // Impedir deletar a si mesmo
        if (req.user?.userId === memberId) {
            return res.status(400).json({ message: 'Não pode remover a si mesmo.' });
        }

        // Deletar garantindo que pertence ao mesmo restaurante
        const deleted = await prisma.user.deleteMany({
            where: {
                id: memberId,
                restaurantId // Garante segurança
            }
        });

        if (deleted.count === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado ou não pertence a este restaurante.' });
        }

        res.json({ success: true, message: 'Membro removido' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao remover membro' });
    }
};
