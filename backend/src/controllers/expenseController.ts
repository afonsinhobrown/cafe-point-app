import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { ensureCashSessionOpen } from '../utils/cashSession';

export const getExpenses = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate, category } = req.query;
        const restaurantId = req.user?.restaurantId;

        if (!restaurantId) return res.status(401).json({ success: false, message: 'Acesso negado' });

        const where: any = { restaurantId };

        if (category) where.category = category;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { date: 'desc' }
        });

        res.json({ success: true, data: expenses });
    } catch (error) {
        console.error('Erro ao buscar despesas:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
    try {
        const { description, amount, category, date, isPaid, paymentMethod, notes } = req.body;
        const restaurantId = req.user?.restaurantId;
        const userId = req.user?.id;

        if (!restaurantId || !userId) return res.status(403).json({ success: false, message: 'Restaurante não identificado' });

        // Despesas pagas precisam de caixa aberto para manter rastreabilidade financeira.
        let cashSessionId: number | null = null;
        if (isPaid ?? true) {
            const openCash = await ensureCashSessionOpen(restaurantId);
            cashSessionId = openCash.id;
        }

        const parsedAmount = parseFloat(amount);
        const expenseDate = date ? new Date(date) : new Date();
        const expense = await prisma.$transaction(async (tx) => {
            const createdExpense = await tx.expense.create({
                data: {
                    restaurantId,
                    description,
                    amount: parsedAmount,
                    category,
                    date: expenseDate,
                    isPaid: isPaid ?? true,
                    paymentMethod,
                    notes
                }
            });

            if (cashSessionId) {
                await tx.cashMovement.create({
                    data: {
                        restaurantId,
                        cashSessionId,
                        userId,
                        type: 'WITHDRAWAL',
                        amount: -Math.abs(parsedAmount),
                        description: `Despesa: ${description}`
                    }
                });
            }

            return createdExpense;
        });

        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        console.error('Erro ao criar despesa:', error);
        const message = error instanceof Error ? error.message : 'Erro interno do servidor';
        res.status(400).json({ success: false, message });
    }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user?.restaurantId;

        const expense = await prisma.expense.findFirst({
            where: { id: parseInt(id), restaurantId }
        });

        if (!expense) return res.status(404).json({ success: false, message: 'Despesa não encontrada' });

        await prisma.expense.delete({
            where: { id: parseInt(id) }
        });

        res.json({ success: true, message: 'Despesa removida com sucesso' });
    } catch (error) {
        console.error('Erro ao remover despesa:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};
