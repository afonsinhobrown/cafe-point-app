import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import prisma from '../config/database';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
        name: string;
        restaurantId: number; // Campos SaaS obrigatórios
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acesso negado. Token não fornecido.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cafe-point-offline-secret-key-2026') as any;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido.'
        });
    }
};

export const authenticateToken = authenticate;

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Requer privilégios de administrador.'
        });
    }
    next();
};

export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Área restrita ao Administrador da Plataforma.'
        });
    }
    next();
};

export const isRegistrar = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || (req.user.role !== 'REGISTRAR' && req.user.role !== 'SUPER_ADMIN')) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Requer conta de Registro (Staff).'
        });
    }
    next();
};

// Middleware para múltiplos papéis
export const allowRoles = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Acesso negado. Requer um dos seguintes papéis: ${roles.join(', ')}`
            });
        }
        next();
    };
};

// 🔴 SaaS MODE: Verificação de licença via banco (obrigatório)
export const checkLicense = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.user.restaurantId) {
            return res.status(401).json({
                success: false,
                message: 'Restaurante não identificado',
                licenseError: true
            });
        }

        // Buscar licença do banco
        const license = await prisma.license.findUnique({
            where: { restaurantId: req.user.restaurantId },
            include: { plan: true }
        });

        // Se não tiver licença
        if (!license) {
            return res.status(403).json({
                success: false,
                message: 'Licença não encontrada. Contacte o administrador.',
                licenseError: true
            });
        }

        // Verificar expiração
        const now = new Date();
        let endDate = license.endDate ? new Date(license.endDate) : null;
        if (!endDate && license.startDate && license.plan?.duration) {
            endDate = new Date(license.startDate);
            endDate.setDate(endDate.getDate() + license.plan.duration);
        }
        if (!endDate) {
            return res.status(500).json({
                success: false,
                message: 'Data de expiração não configurada',
                licenseError: true
            });
        }

        if (now > endDate) {
            return res.status(403).json({
                success: false,
                message: `Licença expirada em ${endDate.toLocaleDateString()}`,
                licenseError: true
            });
        }

        // Licença válida - continuar
        (req as any).license = license;
        next();
    } catch (error) {
        console.error('❌ Erro ao verificar licença:', error);
        res.status(503).json({
            success: false,
            message: 'Erro ao verificar licença. Verifique sua conexão de internet.',
            licenseError: true
        });
    }
};