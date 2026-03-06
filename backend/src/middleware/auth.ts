import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';  // ← MUDAR PARA IMPORT *

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