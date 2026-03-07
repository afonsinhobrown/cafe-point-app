import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { calculateCashSessionBalance, getOpenCashSession } from '../utils/cashSession';

const ENTRY_TYPES_REQUIRING_OPEN_CASH = new Set(['ENTRY', 'WITHDRAWAL']);
const ALL_CASH_MOVEMENT_TYPES = new Set(['ENTRY', 'WITHDRAWAL', 'INTERNAL_TRANSFER']);

export const getCashStatus = async (req: AuthRequest, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        if (!restaurantId) {
            return res.status(401).json({ success: false, message: 'Acesso negado' });
        }

        const activeSession = await getOpenCashSession(restaurantId);
        if (!activeSession) {
            return res.json({
                success: true,
                data: {
                    isOpen: false,
                    session: null,
                    currentBalance: 0
                }
            });
        }

        const currentBalance = await calculateCashSessionBalance(activeSession.id, activeSession.openingBalance);

        return res.json({
            success: true,
            data: {
                isOpen: true,
                session: activeSession,
                currentBalance
            }
        });
    } catch (error) {
        console.error('Erro ao buscar status do caixa:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

export const openCashSession = async (req: AuthRequest, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        const userId = req.user?.id;
        const { openingBalance = 0, notes } = req.body;

        if (!restaurantId || !userId) {
            return res.status(401).json({ success: false, message: 'Acesso negado' });
        }

        const existingOpenSession = await getOpenCashSession(restaurantId);
        if (existingOpenSession) {
            return res.status(400).json({ success: false, message: 'Já existe um caixa aberto.' });
        }

        const openingAmount = Number(openingBalance) || 0;
        if (openingAmount < 0) {
            return res.status(400).json({ success: false, message: 'Saldo inicial não pode ser negativo.' });
        }

        const session = await prisma.cashSession.create({
            data: {
                restaurantId,
                openedByUserId: userId,
                openingBalance: openingAmount,
                notes: notes || null,
                status: 'OPEN'
            }
        });

        return res.status(201).json({
            success: true,
            data: {
                session,
                currentBalance: openingAmount
            }
        });
    } catch (error) {
        console.error('Erro ao abrir caixa:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

export const closeCashSession = async (req: AuthRequest, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        const userId = req.user?.id;
        const { closingBalance, notes } = req.body;

        if (!restaurantId || !userId) {
            return res.status(401).json({ success: false, message: 'Acesso negado' });
        }

        const activeSession = await getOpenCashSession(restaurantId);
        if (!activeSession) {
            return res.status(400).json({ success: false, message: 'Não existe caixa aberto para fechar.' });
        }

        const calculatedBalance = await calculateCashSessionBalance(activeSession.id, activeSession.openingBalance);
        const finalBalance = closingBalance !== undefined ? Number(closingBalance) : calculatedBalance;

        if (Number.isNaN(finalBalance)) {
            return res.status(400).json({ success: false, message: 'Saldo de fechamento inválido.' });
        }

        const session = await prisma.cashSession.update({
            where: { id: activeSession.id },
            data: {
                closedByUserId: userId,
                closingBalance: finalBalance,
                closedAt: new Date(),
                status: 'CLOSED',
                notes: notes ?? activeSession.notes
            }
        });

        return res.json({
            success: true,
            data: {
                session,
                expectedBalance: calculatedBalance,
                difference: finalBalance - calculatedBalance
            }
        });
    } catch (error) {
        console.error('Erro ao fechar caixa:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

export const createCashMovement = async (req: AuthRequest, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        const userId = req.user?.id;
        const { type, amount, description } = req.body;

        if (!restaurantId || !userId) {
            return res.status(401).json({ success: false, message: 'Acesso negado' });
        }

        if (!ALL_CASH_MOVEMENT_TYPES.has(type)) {
            return res.status(400).json({ success: false, message: 'Tipo de movimento inválido.' });
        }

        const rawAmount = Number(amount);
        if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Informe um valor maior que zero.' });
        }

        const activeSession = await getOpenCashSession(restaurantId);
        if (!activeSession) {
            if (ENTRY_TYPES_REQUIRING_OPEN_CASH.has(type)) {
                return res.status(400).json({ success: false, message: 'Caixa fechado. Entrada e saque só são permitidos com caixa aberto.' });
            }
            return res.status(400).json({ success: false, message: 'Não existe caixa aberto para registrar movimento.' });
        }

        const signedAmount = type === 'WITHDRAWAL' ? -Math.abs(rawAmount) : rawAmount;

        const movement = await prisma.cashMovement.create({
            data: {
                restaurantId,
                cashSessionId: activeSession.id,
                userId,
                type,
                amount: signedAmount,
                description: description || null
            }
        });

        const currentBalance = await calculateCashSessionBalance(activeSession.id, activeSession.openingBalance);

        return res.status(201).json({
            success: true,
            data: {
                movement,
                currentBalance
            }
        });
    } catch (error) {
        console.error('Erro ao registrar movimento de caixa:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};

export const getCashMovements = async (req: AuthRequest, res: Response) => {
    try {
        const restaurantId = req.user?.restaurantId;
        if (!restaurantId) {
            return res.status(401).json({ success: false, message: 'Acesso negado' });
        }

        const { limit } = req.query;
        const take = limit ? Math.min(parseInt(String(limit), 10), 200) : 50;

        const movements = await prisma.cashMovement.findMany({
            where: { restaurantId },
            include: {
                user: {
                    select: { id: true, name: true, username: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: Number.isNaN(take) ? 50 : take
        });

        return res.json({ success: true, data: movements });
    } catch (error) {
        console.error('Erro ao buscar movimentos de caixa:', error);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
};
